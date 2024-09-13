# ICP Rust Development Tools 

Automatic candid generation and `dfx build` on save for Internet Computer Protocol (ICP) projects written in Rust.

Do you hate having to run obscure CLI commands in order for your candid files to be generated? Personally, I hated it so I created an extension to circumvent this challenge. After installing this extension, `candid-extractor` will be called automatically on every save done in a Rust canister file. Here's my honest take: You need this for development on ICP. I haven't found a better solution, if you do, please let me know -- I'm eager to hear about it.

## When should I not use this extension?
I do not recommend using this extension for large ICP canister projects. The rust-analyzer is slow and `dfx build` is also a slowpoke. Therefore, combinining low performance of these two with large files and multiple canister projects (e.g an ICP multirepo with frontend, backend, *and more*) will bust your RAM and freeze Visual Studio Code. Not good.   

## Disclaimer

This extension is currently under development and is specifically designed for Rust-based ICP projects. Use with caution in production environments.

**For this extension to work, one must first install the candid-extractor CLI plugin**
``cargo install candid-extractor``

Please report any issues in the extension's [Github repository](https://github.com/vincentes/vsc-icp-development-tools).

## Features

- Automatic generation of candid files 
- Automatic build of canisters on save
- Stop / restart dfx (coming soon)

## Requirements

- Rust extensions for Visual Studio Code
- Rust toolchain
- `dfx` CLI tool

## Release Notes

### 0.0.8
- Added automatic `dfx build` on save

### 0.0.6
- Incorporated the ICP logo

### 0.0.1
- Added automatic candid generation when saving Rust files

## Contributing

Feel free to contribute to this project! We welcome pull requests, bug reports, and feature suggestions. Please see our [contributing guidelines](CONTRIBUTING.md) for more information.

## License
MIT License

## Support

If you encounter any issues or have questions, please file an issue on our [GitHub repository](https://github.com/your-repo-link).
