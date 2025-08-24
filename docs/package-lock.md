### Dependency Management

This project uses `npm` for package management. All dependencies are defined in `package.json`, and locked versions are stored in `package-lock.json` to ensure consistent installs.

Run the following to install all required dependencies:

```bash
npm install
npm list --depth=0 > dependencies.txt
