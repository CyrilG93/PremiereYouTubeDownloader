// // Build Windows Inno Setup installers with a private Python/yt-dlp/FFmpeg/Deno runtime.
import { createReadStream } from "node:fs";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const stagingRoot = path.join(projectRoot, ".youtubedownloader-windows-staging");
const downloadsDir = path.join(stagingRoot, "downloads");
const payloadRoot = path.join(stagingRoot, "payload");
const runtimeRoot = path.join(payloadRoot, "runtime");
const installerRoot = path.join(stagingRoot, "installer");
const releasesDir = path.join(projectRoot, "Releases");
const pythonVersion = process.env.YTDL_WINDOWS_PYTHON_VERSION || "3.11.9";
const pythonShortVersion = pythonVersion.split(".").slice(0, 2).join("");
const pythonEmbedUrl =
  process.env.YTDL_WINDOWS_PYTHON_EMBED_URL ||
  `https://www.python.org/ftp/python/${pythonVersion}/python-${pythonVersion}-embed-amd64.zip`;
const getPipUrl = process.env.YTDL_WINDOWS_GET_PIP_URL || "https://bootstrap.pypa.io/get-pip.py";
const denoZipUrl =
  process.env.YTDL_WINDOWS_DENO_ZIP_URL ||
  "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip";
const ffmpegZipUrl =
  process.env.YTDL_WINDOWS_FFMPEG_ZIP_URL ||
  "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-lgpl.zip";
const innoSetupUrl =
  process.env.YTDL_WINDOWS_INNO_SETUP_URL ||
  "https://github.com/jrsoftware/issrc/releases/download/is-6_7_3/innosetup-6.7.3.exe";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const reuseStaging = process.env.YTDL_WINDOWS_REUSE_STAGING === "1";
const rebuildRuntime = process.env.YTDL_WINDOWS_REBUILD_RUNTIME === "1";
const privatePythonEnv = {
  PYTHONUTF8: "1",
  PYTHONNOUSERSITE: "1",
  PYTHONPATH: "",
  PIP_DISABLE_PIP_VERSION_CHECK: "1"
};

function runCommand(command, args, options = {}) {
  // // Execute build tools with inherited output so long downloads and Inno compiles stay visible.
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      env: {
        ...process.env,
        ...(options.env || {})
      },
      shell: Boolean(options.shell),
      stdio: options.stdio || "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function pathExists(targetPath) {
  // // Probe optional local downloads and generated assets without throwing.
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(targetPath) {
  // // Stream large runtime and installer assets through SHA-256.
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(targetPath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function downloadFile(url, targetPath) {
  // // Download third-party archives only once into the Windows staging cache.
  if (await pathExists(targetPath)) {
    return;
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri ${JSON.stringify(url)} -OutFile ${JSON.stringify(targetPath)}`
  ]);
}

async function expandArchive(zipPath, targetDir) {
  // // Use PowerShell ZIP extraction to avoid an extra archive dependency.
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Expand-Archive -LiteralPath ${JSON.stringify(zipPath)} -DestinationPath ${JSON.stringify(targetDir)} -Force`
  ]);
}

async function configureEmbeddedPython(runtimePythonDir) {
  // // Temporarily enable site imports so get-pip can install packages into the embedded runtime.
  const pthPath = path.join(runtimePythonDir, `python${pythonShortVersion}._pth`);
  const pthLines = [`python${pythonShortVersion}.zip`, ".", "Lib\\site-packages", "import site", ""];
  await mkdir(path.join(runtimePythonDir, "Lib", "site-packages"), { recursive: true });
  await mkdir(path.join(runtimePythonDir, "Scripts"), { recursive: true });
  await writeFile(pthPath, pthLines.join("\r\n"), "utf8");
}

async function lockEmbeddedPythonRuntime(runtimePythonDir) {
  // // Remove import site so the shipped runtime cannot read user Python profiles.
  const pthPath = path.join(runtimePythonDir, `python${pythonShortVersion}._pth`);
  const pthLines = [`python${pythonShortVersion}.zip`, ".", "Lib\\site-packages", ""];
  await writeFile(pthPath, pthLines.join("\r\n"), "utf8");
}

async function prunePythonRuntime(runtimePythonDir) {
  // // Remove development artifacts while preserving runtime DLLs, modules, and executables.
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      `$root = ${JSON.stringify(runtimePythonDir)};`,
      "Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.lib', '.pdb' } | Remove-Item -Force;",
      "Get-ChildItem -LiteralPath $root -Recurse -Directory -Filter __pycache__ -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue"
    ].join(" ")
  ]);
}

async function preparePythonRuntime() {
  // // Build an isolated Python runtime containing yt-dlp and its EJS challenge helper dependencies.
  const pythonZip = path.join(downloadsDir, `python-${pythonVersion}-embed-amd64.zip`);
  const getPipPath = path.join(downloadsDir, "get-pip.py");
  const runtimePythonDir = path.join(runtimeRoot, "python");
  const pythonExe = path.join(runtimePythonDir, "python.exe");

  await downloadFile(pythonEmbedUrl, pythonZip);
  await expandArchive(pythonZip, runtimePythonDir);
  await configureEmbeddedPython(runtimePythonDir);

  await downloadFile(getPipUrl, getPipPath);
  await runCommand(pythonExe, [getPipPath, "--no-warn-script-location"], {
    env: privatePythonEnv
  });
  await runCommand(pythonExe, [
    "-m",
    "pip",
    "install",
    "--upgrade",
    "--no-cache-dir",
    "--no-warn-script-location",
    "yt-dlp[default]"
  ], {
    env: privatePythonEnv
  });

  await prunePythonRuntime(runtimePythonDir);
  await lockEmbeddedPythonRuntime(runtimePythonDir);
  await validatePythonRuntime();
}

async function validatePythonRuntime() {
  // // Confirm yt-dlp works through both the Python module and generated console executable.
  const pythonExe = path.join(runtimeRoot, "python", "python.exe");
  const ytDlpExe = path.join(runtimeRoot, "python", "Scripts", "yt-dlp.exe");
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      `$python = ${JSON.stringify(pythonExe)};`,
      `$ytdlp = ${JSON.stringify(ytDlpExe)};`,
      "if (-not (Test-Path -LiteralPath $python -PathType Leaf)) { throw \"Private Python executable is missing: $python\" }",
      "if (-not (Test-Path -LiteralPath $ytdlp -PathType Leaf)) { throw \"Private yt-dlp executable is missing: $ytdlp\" }",
      "Unblock-File -LiteralPath $python -ErrorAction SilentlyContinue;",
      "Unblock-File -LiteralPath $ytdlp -ErrorAction SilentlyContinue;",
      "& $python -m yt_dlp --version;",
      "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }",
      "& $ytdlp --version;",
      "exit $LASTEXITCODE"
    ].join(" ")
  ], {
    env: privatePythonEnv
  });
}

async function prepareFfmpegRuntime() {
  // // Bundle a private LGPL FFmpeg build so downloads and conversions do not depend on system PATH.
  const localFfmpegZip = process.env.YTDL_WINDOWS_FFMPEG_ZIP || "";
  const ffmpegZip = localFfmpegZip || path.join(downloadsDir, path.basename(new URL(ffmpegZipUrl).pathname));
  const extractedDir = path.join(stagingRoot, "ffmpeg-extracted");
  const runtimeFfmpegDir = path.join(runtimeRoot, "ffmpeg");

  if (!localFfmpegZip) {
    await downloadFile(ffmpegZipUrl, ffmpegZip);
  }

  await expandArchive(ffmpegZip, extractedDir);
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      `$source = Get-ChildItem -LiteralPath ${JSON.stringify(extractedDir)} -Recurse -File -Filter ffmpeg.exe | Select-Object -First 1;`,
      "if (-not $source) { throw 'ffmpeg.exe not found in archive' }",
      "$root = Split-Path -Parent (Split-Path -Parent $source.FullName);",
      `$target = ${JSON.stringify(runtimeFfmpegDir)};`,
      "New-Item -ItemType Directory -Path (Join-Path $target 'bin') -Force | Out-Null;",
      "Copy-Item -Path (Join-Path $root 'bin\\*') -Destination (Join-Path $target 'bin') -Recurse -Force;",
      "Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Name -match '^(LICENSE|COPYING|README|VERSION)' } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $target -Force }"
    ].join(" ")
  ]);

  await validateFfmpegRuntime();
}

async function validateFfmpegRuntime() {
  // // Validate FFmpeg from a temp copy because Windows policies can dislike hidden staging paths.
  const runtimeFfmpegExe = path.join(runtimeRoot, "ffmpeg", "bin", "ffmpeg.exe");
  const runtimeFfprobeExe = path.join(runtimeRoot, "ffmpeg", "bin", "ffprobe.exe");
  const tempFfmpegExe = path.join(process.env.TEMP || stagingRoot, "youtubedownloader-ffmpeg-lgpl-test.exe");

  if (!(await pathExists(runtimeFfmpegExe))) {
    throw new Error(`FFmpeg executable missing from runtime payload: ${runtimeFfmpegExe}`);
  }
  if (!(await pathExists(runtimeFfprobeExe))) {
    throw new Error(`FFprobe executable missing from runtime payload: ${runtimeFfprobeExe}`);
  }

  await cp(runtimeFfmpegExe, tempFfmpegExe);
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Unblock-File -LiteralPath ${JSON.stringify(tempFfmpegExe)} -ErrorAction SilentlyContinue`
  ]);
  await runCommand(tempFfmpegExe, ["-version"]);
}

async function prepareDenoRuntime() {
  // // Bundle Deno so yt-dlp can solve YouTube JavaScript challenges without a global Deno install.
  const localDenoZip = process.env.YTDL_WINDOWS_DENO_ZIP || "";
  const denoZip = localDenoZip || path.join(downloadsDir, "deno-x86_64-pc-windows-msvc.zip");
  const extractedDir = path.join(stagingRoot, "deno-extracted");
  const runtimeDenoDir = path.join(runtimeRoot, "deno", "bin");

  if (!localDenoZip) {
    await downloadFile(denoZipUrl, denoZip);
  }

  await expandArchive(denoZip, extractedDir);
  await mkdir(runtimeDenoDir, { recursive: true });
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      `$source = Get-ChildItem -LiteralPath ${JSON.stringify(extractedDir)} -Recurse -File -Filter deno.exe | Select-Object -First 1;`,
      "if (-not $source) { throw 'deno.exe not found in archive' }",
      `Copy-Item -LiteralPath $source.FullName -Destination ${JSON.stringify(path.join(runtimeDenoDir, "deno.exe"))} -Force;`
    ].join(" ")
  ]);
  // // Ship Deno's MIT notice with every redistributed runtime.
  await cp(
    path.join(projectRoot, "installers", "licenses", "DENO_LICENSE.md"),
    path.join(runtimeRoot, "deno", "LICENSE.md")
  );

  await validateDenoRuntime();
}

async function validateDenoRuntime() {
  // // Verify Deno starts from the private runtime folder before including it in installers.
  const denoExe = path.join(runtimeRoot, "deno", "bin", "deno.exe");
  if (!(await pathExists(denoExe))) {
    throw new Error(`Deno executable missing from runtime payload: ${denoExe}`);
  }
  await runCommand(denoExe, ["--version"]);
}

async function copyExtensionPayload() {
  // // Stage the CEP extension and helper files into the installer payload.
  const distDir = path.join(payloadRoot, "dist", "PremiereYouTubeDownloader");
  await rm(path.join(payloadRoot, "dist"), { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  for (const dirName of ["client", "host", "CSXS"]) {
    await cp(path.join(projectRoot, dirName), path.join(distDir, dirName), { recursive: true });
  }
  for (const fileName of [
    ".debug",
    "README.md",
    "INSTALLATION_GUIDE.md",
    "UPDATE_DEPENDENCIES.bat",
    "UPDATE_DEPENDENCIES_WINDOWS.ps1"
  ]) {
    const sourcePath = path.join(projectRoot, fileName);
    if (await pathExists(sourcePath)) {
      await cp(sourcePath, path.join(distDir, fileName));
    }
  }

  await mkdir(path.join(payloadRoot, "installers"), { recursive: true });
  await cp(
    path.join(projectRoot, "installers", "youtubedownloader_install_windows_private_runtime.ps1"),
    path.join(payloadRoot, "installers", "youtubedownloader_install_windows_private_runtime.ps1")
  );
  await cp(path.join(projectRoot, "README.md"), path.join(payloadRoot, "README.md"));
}

async function findExistingInnoCompiler() {
  // // Prefer an explicit compiler path, then common local Inno Setup locations.
  const candidates = [
    process.env.YTDL_WINDOWS_ISCC_PATH || "",
    path.join(stagingRoot, "tools", "Inno Setup 6", "ISCC.exe"),
    path.join(stagingRoot, "tools", "Inno", "ISCC.exe"),
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return "";
}

async function prepareInnoCompiler() {
  // // Install Inno Setup into staging when the build PC does not already have it.
  const existingCompiler = await findExistingInnoCompiler();
  if (existingCompiler) {
    return existingCompiler;
  }

  const installerPath = path.join(downloadsDir, "innosetup.exe");
  const installDir = path.join(stagingRoot, "tools", "Inno");
  await downloadFile(innoSetupUrl, installerPath);
  await mkdir(installDir, { recursive: true });
  await runCommand("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    [
      `$installer = ${JSON.stringify(installerPath)};`,
      `$installDir = ${JSON.stringify(installDir)};`,
      "$args = @('/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/CURRENTUSER', ('/DIR=' + $installDir));",
      "$process = Start-Process -FilePath $installer -ArgumentList $args -Wait -PassThru -WindowStyle Hidden;",
      "exit $process.ExitCode"
    ].join(" ")
  ]);

  const compilerPath = (await findExistingInnoCompiler()) || path.join(installDir, "ISCC.exe");
  if (!(await pathExists(compilerPath))) {
    throw new Error(`Inno Setup compiler missing after install: ${compilerPath}`);
  }
  return compilerPath;
}

function escapeInnoString(value) {
  // // Escape double quotes for generated Inno Setup string literals.
  return String(value || "").replace(/"/g, '""');
}

function escapePascalString(value) {
  // // Escape apostrophes for generated Inno Setup Pascal string literals.
  return String(value || "").replace(/'/g, "''");
}

async function readPackageVersion() {
  // // Use package.json as the single version source for Windows installer artifact names.
  const raw = await readFile(path.join(projectRoot, "package.json"), "utf8");
  const parsed = JSON.parse(raw);
  return String(parsed.version || "").trim();
}

async function prepareRuntimePayload(version) {
  // // Build or validate each private dependency before handing the payload to Inno Setup.
  if (reuseStaging && !rebuildRuntime && (await pathExists(path.join(runtimeRoot, "python", "python.exe")))) {
    await validatePythonRuntime();
  } else {
    await preparePythonRuntime();
  }
  if (reuseStaging && !rebuildRuntime && (await pathExists(path.join(runtimeRoot, "ffmpeg", "bin", "ffmpeg.exe")))) {
    await validateFfmpegRuntime();
  } else {
    await prepareFfmpegRuntime();
  }
  if (reuseStaging && !rebuildRuntime && (await pathExists(path.join(runtimeRoot, "deno", "bin", "deno.exe")))) {
    await validateDenoRuntime();
  } else {
    await prepareDenoRuntime();
  }
  // // Repair reused staging folders that predate the bundled Deno notice.
  await cp(
    path.join(projectRoot, "installers", "licenses", "DENO_LICENSE.md"),
    path.join(runtimeRoot, "deno", "LICENSE.md")
  );
  await writeFile(path.join(runtimeRoot, ".youtubedownloader-runtime-version"), `${version}\r\n`, "ascii");
}

async function createFullInstaller(compilerPath, version) {
  // // Build the only supported Windows artifact with the complete private runtime embedded.
  const outputBaseName = `PremiereYouTubeDownloader-v${version}-Windows-Full-Installer`;
  const outputPath = path.join(releasesDir, `${outputBaseName}.exe`);
  const scriptPath = path.join(installerRoot, "YouTubeDownloaderFull.iss");
  const iss = [
    "; // Generated by youtubedownloader-package-windows-exe.mjs.",
    "[Setup]",
    "AppId={{79E9C263-322B-48D8-8B58-2B90A3414533}",
    "AppName=YouTube Downloader",
    `AppVersion=${version}`,
    "AppPublisher=Cyril Plugin",
    "DefaultDirName={localappdata}\\PremiereYouTubeDownloader\\InstallerPayload",
    "CreateAppDir=no",
    "DisableDirPage=yes",
    "DisableProgramGroupPage=yes",
    "Uninstallable=no",
    "PrivilegesRequired=lowest",
    "RestartIfNeededByRun=no",
    "ArchitecturesAllowed=x64compatible",
    "ArchitecturesInstallIn64BitMode=x64compatible",
    "Compression=lzma2/ultra64",
    "SolidCompression=yes",
    "WizardStyle=modern dynamic",
    `OutputDir=${escapeInnoString(releasesDir)}`,
    `OutputBaseFilename=${outputBaseName}`,
    "",
    "[Files]",
    `Source: "${escapeInnoString(path.join(payloadRoot, "README.md"))}"; DestDir: "{tmp}\\YouTubeDownloaderPayload"; Flags: ignoreversion`,
    `Source: "${escapeInnoString(path.join(payloadRoot, "dist", "PremiereYouTubeDownloader", "*"))}"; DestDir: "{tmp}\\YouTubeDownloaderPayload\\dist\\PremiereYouTubeDownloader"; Flags: recursesubdirs createallsubdirs ignoreversion`,
    `Source: "${escapeInnoString(path.join(runtimeRoot, "*"))}"; DestDir: "{tmp}\\YouTubeDownloaderPayload\\runtime"; Flags: recursesubdirs createallsubdirs ignoreversion`,
    `Source: "${escapeInnoString(path.join(payloadRoot, "installers", "youtubedownloader_install_windows_private_runtime.ps1"))}"; DestDir: "{tmp}\\YouTubeDownloaderPayload\\installers"; Flags: ignoreversion; AfterInstall: RunFullInstallation`,
    "",
    "[Code]",
    "var",
    "  ReadyWarningLabel: TNewStaticText;",
    "",
    "procedure RunFullInstallation;",
    "var",
    "  ResultCode: Integer;",
    "  PowerShellPath: String;",
    "  Parameters: String;",
    "begin",
    "  PowerShellPath := ExpandConstant('{sys}\\WindowsPowerShell\\v1.0\\powershell.exe');",
    `  Parameters := '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\\YouTubeDownloaderPayload\\installers\\youtubedownloader_install_windows_private_runtime.ps1') + '" -PayloadRoot "' + ExpandConstant('{tmp}\\YouTubeDownloaderPayload') + '" -RuntimeVersion "${escapePascalString(version)}"';`,
    "  if not Exec(PowerShellPath, Parameters, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then",
    "    RaiseException('Unable to start the YouTube Downloader installation script.');",
    "  if ResultCode <> 0 then",
    "    RaiseException(Format('YouTube Downloader installation failed with code %d.', [ResultCode]));",
    "end;",
    "",
    "procedure InitializeWizard;",
    "begin",
    "  WizardForm.ReadyMemo.Visible := False;",
    "  ReadyWarningLabel := TNewStaticText.Create(WizardForm);",
    "  ReadyWarningLabel.Parent := WizardForm.ReadyPage;",
    "  ReadyWarningLabel.Left := WizardForm.ReadyMemo.Left;",
    "  ReadyWarningLabel.Top := WizardForm.ReadyMemo.Top;",
    "  ReadyWarningLabel.Width := WizardForm.ReadyMemo.Width;",
    "  ReadyWarningLabel.AutoSize := False;",
    "  ReadyWarningLabel.WordWrap := True;",
    "  ReadyWarningLabel.Height := ScaleY(58);",
    "  ReadyWarningLabel.Font.Style := [fsBold];",
    "  ReadyWarningLabel.Caption := 'Important: after you click Install, this window may appear frozen for a few seconds while Windows checks the installation files. This is normal; please wait.';",
    "end;",
    ""
  ].join("\r\n");

  await mkdir(installerRoot, { recursive: true });
  await mkdir(releasesDir, { recursive: true });
  await rm(outputPath, { force: true });
  await writeFile(scriptPath, iss, "utf8");
  await runCommand(compilerPath, ["/Qp", scriptPath]);
  const sha256 = await hashFile(outputPath);
  process.stdout.write(`Full Windows installer created at ${outputPath}\nSHA-256: ${sha256}\n`);
}

async function main() {
  // // Windows EXE packaging depends on PowerShell, Windows binaries, and Inno Setup.
  if (process.platform !== "win32") {
    throw new Error("Windows EXE packaging must run on Windows.");
  }

  const version = await readPackageVersion();
  if (!version) {
    throw new Error("package.json does not contain a version.");
  }

  if (!reuseStaging) {
    await rm(stagingRoot, { recursive: true, force: true });
  }
  await mkdir(downloadsDir, { recursive: true });
  await mkdir(runtimeRoot, { recursive: true });
  await mkdir(releasesDir, { recursive: true });

  await runCommand(npmCommand, ["run", "verify"], { shell: process.platform === "win32" });
  await copyExtensionPayload();
  await prepareRuntimePayload(version);

  const compilerPath = await prepareInnoCompiler();
  if (!(await pathExists(path.join(runtimeRoot, "python", "python.exe")))) {
    throw new Error("Full Windows installer cannot be built because the private runtime is incomplete.");
  }
  await createFullInstaller(compilerPath, version);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
