import {
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  TextDocument,
  window,
  workspace,
} from "vscode";
import * as cp from "child_process";
import * as path from "path";
import * as fs from "fs";

const terminalName = "dfx: status";

let statusBarItem: StatusBarItem;

function createStatusBarItem() {
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
  statusBarItem.text =
    "$(sync~spin) Generating candid and building canisters...";
  statusBarItem.tooltip =
    "ICP Dev Tools: Generating candid and building canisters";
  statusBarItem.hide();
}

const execShell = (cmd: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });
  });
};

const execShellInTerminal = (cmd: string): void => {
  let terminal = window.terminals.find((t) => t.name === terminalName);
  if (!terminal) {
    terminal = window.createTerminal(terminalName);
  }

  terminal.show();
  terminal.sendText(cmd);
};

async function cargoBuild(
  canister: string,
  workspacePath: string
): Promise<boolean> {
  const canisterRoot = path.join(workspacePath, "src", canister);
  const cargoToml = path.join(canisterRoot, "Cargo.toml");

  try {
    await execShell(
      `cargo build --manifest-path="${cargoToml}" --target wasm32-unknown-unknown --release --package "${canister}"`
    );
    return true;
  } catch (error) {
    // We are not going to do anything with the error here, it's the Rust extension's job to show it
    window.showErrorMessage(
      `Could not build the canister ${canister}\n\n${error}`
    );
    return false;
  }
}

function findCanisters(workspacePath: string): string[] {
  const srcPath = path.join(workspacePath, "src");
  if (!fs.existsSync(srcPath)) {
    return [];
  }

  return fs
    .readdirSync(srcPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => {
      const cargoTomlPath = path.join(srcPath, dirent.name, "Cargo.toml");
      return fs.existsSync(cargoTomlPath);
    })
    .map((dirent) => dirent.name);
}

async function dfxBuild(workspacePath: string): Promise<void> {
  statusBarItem.show();

  try {
    await execShell(`cd ${workspacePath} && dfx build`);
  } catch (error) {
    window.showErrorMessage(`Could not build using DFX.`);
  } finally {
    statusBarItem.hide();
  }
}

async function generateDid(
  canister: string,
  workspacePath: string
): Promise<void> {
  statusBarItem.show();

  const targetWasm = path.join(
    workspacePath,
    "target",
    "wasm32-unknown-unknown",
    "release",
    `${canister}.wasm`
  );

  const outputDid = path.join(
    workspacePath,
    "src",
    canister,
    `${canister}.did`
  );

  try {
    // Generate the Candid file
    await execShell(`candid-extractor "${targetWasm}" > "${outputDid}"`);
  } catch (error) {
    window.showErrorMessage(`Could not generate the candid files.`);
  } finally {
    statusBarItem.hide();
  }
}

export function activate(context: ExtensionContext) {
  window.showInformationMessage("ICP Dev Tools extension is now active!");

  createStatusBarItem();

  workspace.onDidSaveTextDocument(async (document: TextDocument) => {
    if (document.languageId === "rust" && document.uri.scheme === "file") {
      const currWorkspace = workspace.getWorkspaceFolder(document.uri);

      if (!currWorkspace) {
        window.showErrorMessage("Candid generation: No workspace folder found");
        return;
      }

      const workspacePath = currWorkspace.uri.fsPath;

      const CANISTERS = findCanisters(workspacePath);

      if (CANISTERS.length === 0) {
        window.showWarningMessage("No canisters found in the workspace.");
        return;
      } else {
        window.showInformationMessage(
          `Found ${CANISTERS.length} canisters in the workspace.`
        );
      }

      for (const canister of CANISTERS) {
        const buildSucceeded = await cargoBuild(canister, workspacePath);
        if (buildSucceeded) {
          await generateDid(canister, workspacePath);
        }
      }

      await dfxBuild(workspacePath);
    }
  });

  const disposable = commands.registerCommand(
    "icp-dev-tools.generateCandid",
    () => {
      window.showInformationMessage(
        "Generating candid files for the current project."
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
