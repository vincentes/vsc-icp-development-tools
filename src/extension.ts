import {
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
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
  statusBarItem.text = "$(sync~spin) ICP Dev Tools";
  statusBarItem.tooltip = "ICP Dev Tools";
  statusBarItem.show();
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
    window.showErrorMessage(`Failed to build ${canister}: ${error}`);
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
  statusBarItem.text = "$(sync~spin) Building canisters...";
  statusBarItem.show();

  try {
    await execShell(`cd ${workspacePath} && dfx build`);
    window.showInformationMessage("DFX build completed successfully.");
  } catch (error) {
    window.showErrorMessage(`DFX build failed: ${error}`);
  } finally {
    statusBarItem.text = "$(sync) ICP Dev Tools";
  }
}

async function generateDid(
  canister: string,
  workspacePath: string
): Promise<void> {
  statusBarItem.text = `$(sync~spin) Generating Candid for ${canister}...`;
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
    await execShell(`candid-extractor "${targetWasm}" > "${outputDid}"`);
    window.showInformationMessage(`Candid generated for ${canister}.`);
  } catch (error) {
    window.showErrorMessage(
      `Failed to generate Candid for ${canister}: ${error}`
    );
  } finally {
    statusBarItem.text = "$(sync) ICP Dev Tools";
  }
}

export function activate(context: ExtensionContext) {
  window.showInformationMessage("ICP Dev Tools extension is now active!");

  createStatusBarItem();

  const generateCandidCommand = commands.registerCommand(
    "icp-dev-tools.generateCandid",
    async () => {
      const workspaceFolders = workspace.workspaceFolders;
      if (!workspaceFolders) {
        window.showErrorMessage("No workspace folder found");
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      const CANISTERS = findCanisters(workspacePath);

      if (CANISTERS.length === 0) {
        window.showWarningMessage("No canisters found in the workspace.");
        return;
      }

      for (const canister of CANISTERS) {
        const buildSucceeded = await cargoBuild(canister, workspacePath);
        if (buildSucceeded) {
          await generateDid(canister, workspacePath);
        }
      }
    }
  );

  const buildCommand = commands.registerCommand(
    "icp-dev-tools.build",
    async () => {
      const workspaceFolders = workspace.workspaceFolders;
      if (!workspaceFolders) {
        window.showErrorMessage("No workspace folder found");
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      await dfxBuild(workspacePath);
    }
  );

  const buildAndGenerateCommand = commands.registerCommand(
    "icp-dev-tools.buildAndGenerate",
    async () => {
      await commands.executeCommand("icp-dev-tools.generateCandid");
      await commands.executeCommand("icp-dev-tools.build");
    }
  );

  context.subscriptions.push(
    generateCandidCommand,
    buildCommand,
    buildAndGenerateCommand
  );
}

export function deactivate() {}
