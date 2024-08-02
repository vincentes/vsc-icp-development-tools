import {
  commands,
  ExtensionContext,
  TextDocument,
  window,
  workspace,
} from "vscode";
import * as cp from "child_process";
import * as path from "path";

const terminalName = "dfx: status";

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

async function generateDid(
  canister: string,
  workspacePath: string
): Promise<void> {
  const canisterRoot = path.join(workspacePath, "src", canister);
  const cargoToml = path.join(canisterRoot, "Cargo.toml");
  const targetWasm = path.join(
    workspacePath,
    "target",
    "wasm32-unknown-unknown",
    "release",
    `${canister}.wasm`
  );
  const outputDid = path.join(canisterRoot, `${canister}.did`);

  try {
    // Build the Wasm
    await execShell(
      `cargo build --manifest-path="${cargoToml}" --target wasm32-unknown-unknown --release --package "${canister}"`
    );

    // Generate the Candid file
    await execShell(`candid-extractor "${targetWasm}" > "${outputDid}"`);

    window.showInformationMessage(`Candid generated for ${canister}`);
  } catch (error) {
    window.showErrorMessage(`Could not generate the candid files.`);
    execShellInTerminal(
      `echo "Error generating Candid for ${canister}: ${error}"`
    );
  }
}

export function activate(context: ExtensionContext) {
  window.showInformationMessage("ICP Dev Tools extension is now active!");

  workspace.onDidSaveTextDocument(async (document: TextDocument) => {
    if (document.languageId === "rust" && document.uri.scheme === "file") {
      const currWorkspace = workspace.getWorkspaceFolder(document.uri);

      if (!currWorkspace) {
        window.showErrorMessage("Candid generation: No workspace folder found");
        return;
      }

      const workspacePath = currWorkspace.uri.fsPath;

      // Define your canisters here
      const CANISTERS = ["account"]; // Add more canisters as needed

      for (const canister of CANISTERS) {
        await generateDid(canister, workspacePath);
      }
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
