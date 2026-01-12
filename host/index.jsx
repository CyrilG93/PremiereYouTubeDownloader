// ExtendScript for Adobe Premiere Pro integration

#target premierepro

// Get current project path
function getProjectPath() {
    if (app.project.path) {
        return app.project.path;
    }
    return null;
}

// Select folder dialog
function selectFolder() {
    var folder = Folder.selectDialog("Sélectionner le dossier de destination");
    if (folder) {
        return folder.fsName;
    }
    return null;
}

// Find or create bin (supports nested paths like "MEDIAS/Test")
function findOrCreateBin(binPath) {
    var project = app.project;
    var currentParent = project.rootItem;

    // Split path by both / and \ to handle nested folders on any platform
    // This regex handles both forward and back slashes
    var binParts = binPath.split(/[\/\\]/);

    // Handle paths that start with ./ or ../
    var cleanParts = [];
    for (var i = 0; i < binParts.length; i++) {
        var part = binParts[i];
        if (part !== '' && part !== '.' && part !== '..') {
            cleanParts.push(part);
        }
    }

    // Create each level of the hierarchy
    for (var j = 0; j < cleanParts.length; j++) {
        var binName = cleanParts[j];
        var foundBin = null;

        // Search for existing bin at current level
        for (var k = 0; k < currentParent.children.numItems; k++) {
            var item = currentParent.children[k];
            if (item.type === ProjectItemType.BIN && item.name === binName) {
                foundBin = item;
                break;
            }
        }

        // Create bin if not found
        if (!foundBin) {
            foundBin = currentParent.createBin(binName);
        }

        // Move to next level
        currentParent = foundBin;
    }

    return currentParent;
}

// Import media file into Premiere Pro
function importMedia(filePath, binName, createBin) {
    try {
        var project = app.project;

        if (!project) {
            return "error: No active project";
        }

        // Check if file exists
        var file = new File(filePath);
        if (!file.exists) {
            return "error: File not found - " + filePath;
        }

        var targetBin = project.rootItem;

        // Create or find bin if requested
        if (createBin && binName) {
            targetBin = findOrCreateBin(binName);
        }

        // Import the file
        var importedItems = project.importFiles(
            [filePath],
            true, // suppress UI
            targetBin,
            false // import as numbered stills
        );

        if (importedItems && importedItems.length > 0) {
            // Select the imported item in project panel
            project.activeSequence = null; // Deselect sequence

            return "success";
        } else {
            return "error: Import failed";
        }

    } catch (e) {
        return "error: " + e.toString();
    }
}

// Start download server (Node.js)
function startDownloadServer() {
    try {
        var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        var serverPath = extensionPath + "/server/index.js";

        // Check if server file exists
        var serverFile = new File(serverPath);
        if (!serverFile.exists) {
            return JSON.stringify({ error: "Server file not found" });
        }

        // Start Node.js server
        var command;
        if ($.os.indexOf("Windows") !== -1) {
            command = 'node "' + serverPath + '"';
        } else {
            command = "node '" + serverPath + "'";
        }

        // Execute command
        var result = system.callSystem(command);

        return JSON.stringify({
            port: 3000,
            status: "started"
        });

    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// Utility: Get project info
function getProjectInfo() {
    try {
        var project = app.project;

        if (!project) {
            return JSON.stringify({ error: "No active project" });
        }

        var info = {
            name: project.name,
            path: project.path || null,
            sequences: project.sequences.numSequences,
            rootItems: project.rootItem.children.numItems
        };

        return JSON.stringify(info);

    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// Utility: Create folder structure
function createFolderStructure(basePath, folderName) {
    try {
        var folder = new Folder(basePath + "/" + folderName);

        if (!folder.exists) {
            if (folder.create()) {
                return folder.fsName;
            } else {
                return null;
            }
        }

        return folder.fsName;

    } catch (e) {
        return null;
    }
}
