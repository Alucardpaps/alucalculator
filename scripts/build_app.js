const fs = require('fs');
const path = require('path');
const http = require('http');
const child_process = require('child_process');

const rootDir = path.join(__dirname, '..');
const keytoolPath = 'C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe';
const keystorePath = path.join(rootDir, 'android', 'alucalc-release.keystore');
const twaManifestPath = path.join(rootDir, 'android', 'twa-manifest.json');
const storepass = 'alucalc123';
const PORT = 8585;

function runCmd(cmd, options = {}) {
  console.log(`Running: ${cmd}`);
  const jdkPath = path.resolve(rootDir, 'jdk17');
  const jdkBinPath = path.join(jdkPath, 'bin');
  const env = { ...process.env, ...options.env };
  env.JAVA_HOME = jdkPath;
  env.PATH = `${jdkBinPath}${path.delimiter}${env.PATH || ''}`;

  return new Promise((resolve, reject) => {
    const child = child_process.spawn(cmd, {
      shell: true,
      cwd: options.cwd || rootDir,
      env: env
    });

    child.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Auto-respond to overwrite, proceed, or y/n prompts
      if (output.includes('?') || output.toLowerCase().includes('proceed') || output.toLowerCase().includes('overwrite')) {
        console.log('\n[Auto-Responder] Detected prompt, sending "y"');
        child.stdin.write('y\n');
      }
      
      // Auto-respond to password prompts if any
      if (output.toLowerCase().includes('password')) {
        console.log('\n[Auto-Responder] Detected password prompt, sending password');
        child.stdin.write('alucalc123\n');
      }
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command "${cmd}" exited with code ${code}`));
      }
    });
  });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      if (element !== '.gradle' && element !== 'build') {
        copyFolderSync(fromPath, toPath);
      }
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}


// Simple static server to serve local public/ directory during compilation
function startLocalServer(port) {
  const server = http.createServer((req, res) => {
    let safeUrl = req.url.split('?')[0];
    const filePath = path.join(rootDir, 'public', safeUrl);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      let contentType = 'text/plain';
      if (safeUrl.endsWith('.png')) contentType = 'image/png';
      else if (safeUrl.endsWith('.json')) contentType = 'application/json';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Server] Local static asset server running on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function buildApp() {
  console.log('===================================================');
  console.log('   AluCalc OS — Automated Android Build Pipeline   ');
  console.log('===================================================');

  // Check for CI/GitHub Actions environment
  if (process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true') {
    console.log('[CI/CD] GitHub Actions or CI environment detected.');
    console.log('[CI/CD] Skipping Android TWA compilation. Pre-compiled binaries in public/app/ will be exported.');
    
    // Copy digital asset links json to out/ so it's included in the static build
    console.log('[CI/CD] Copying existing assetlinks.json to out/.well-known/...');
    const publicAssetlinks = path.join(rootDir, 'public', '.well-known', 'assetlinks.json');
    const outWellKnownDir = path.join(rootDir, 'out', '.well-known');
    if (fs.existsSync(publicAssetlinks)) {
      if (!fs.existsSync(outWellKnownDir)) fs.mkdirSync(outWellKnownDir, { recursive: true });
      fs.copyFileSync(publicAssetlinks, path.join(outWellKnownDir, 'assetlinks.json'));
      console.log('[CI/CD] assetlinks.json copied.');
    }
    
    // Copy APK & AAB to out/app/ so they are downloadable on the production site
    console.log('[CI/CD] Copying pre-built binaries to out/app/...');
    const outAppDir = path.join(rootDir, 'out', 'app');
    const publicAppDir = path.join(rootDir, 'public', 'app');
    if (!fs.existsSync(outAppDir)) fs.mkdirSync(outAppDir, { recursive: true });
    
    const apkFile = path.join(publicAppDir, 'alucalc-release.apk');
    const aabFile = path.join(publicAppDir, 'alucalc-release.aab');
    if (fs.existsSync(apkFile)) {
      fs.copyFileSync(apkFile, path.join(outAppDir, 'alucalc-release.apk'));
      console.log('[CI/CD] alucalc-release.apk copied.');
    }
    if (fs.existsSync(aabFile)) {
      fs.copyFileSync(aabFile, path.join(outAppDir, 'alucalc-release.aab'));
      console.log('[CI/CD] alucalc-release.aab copied.');
    }
    
    console.log('[CI/CD] Build pipeline complete (CI mode).');
    return;
  }

  // 1. Keystore Generation (if missing)
  if (!fs.existsSync(keystorePath)) {
    console.log('Keystore not found. Generating new release keystore...');
    const dname = 'CN=AluCalc, OU=Engineering, O=AluCalc, L=Istanbul, S=Istanbul, C=TR';
    const genKeyCmd = `"${keytoolPath}" -genkey -v -keystore "${keystorePath}" -alias alucalc -keyalg RSA -keysize 2048 -validity 10000 -storepass ${storepass} -keypass ${storepass} -dname "${dname}"`;
    await runCmd(genKeyCmd);
    console.log('Keystore generated successfully!');
  } else {
    console.log('Existing keystore found.');
  }

  // 2. Extract SHA-256 Fingerprint
  console.log('Extracting SHA-256 fingerprint from keystore...');
  const listCmd = `"${keytoolPath}" -list -v -keystore "${keystorePath}" -storepass ${storepass} -alias alucalc`;
  const listOutput = child_process.execSync(listCmd, { cwd: rootDir }).toString();
  
  const shaRegex = /SHA256:\s*([A-Fa-f0-9:]+)/;
  const match = listOutput.match(shaRegex);
  if (!match) {
    throw new Error('Failed to find SHA-256 fingerprint in keytool output.');
  }
  const fingerprint = match[1].trim().toUpperCase();
  console.log(`SHA-256 Fingerprint: ${fingerprint}`);

  // 3. Start Local HTTP Server for Bubblewrap download
  const server = await startLocalServer(PORT);

  // 4. Update and temporarily point twa-manifest.json to local assets
  let originalManifestContent = '';
  if (fs.existsSync(twaManifestPath)) {
    console.log('Updating twa-manifest.json with fingerprint & local asset URLs...');
    originalManifestContent = fs.readFileSync(twaManifestPath, 'utf8');
    const manifest = JSON.parse(originalManifestContent);
    
    // Inject Fingerprint
    manifest.fingerprints = [
      {
        type: 'sha256',
        value: fingerprint
      }
    ];
    
    // Temporarily point icons to local server
    manifest.iconUrl = `http://localhost:${PORT}/icons/icon-512.png`;
    manifest.maskableIconUrl = `http://localhost:${PORT}/icons/icon-512.png`;
    
    fs.writeFileSync(twaManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('twa-manifest.json prepped for build.');
  } else {
    server.close();
    throw new Error('twa-manifest.json not found in workspace root!');
  }

  try {
    // 5. Generate assetlinks.json
    console.log('Generating digital asset links...');
    const assetLinks = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.alucard.alucalcos',
          sha256_cert_fingerprints: [fingerprint]
        }
      }
    ];
    
    const assetLinksJson = JSON.stringify(assetLinks, null, 2);
    
    // Write to public/
    const publicWellKnownDir = path.join(rootDir, 'public', '.well-known');
    if (!fs.existsSync(publicWellKnownDir)) fs.mkdirSync(publicWellKnownDir, { recursive: true });
    fs.writeFileSync(path.join(publicWellKnownDir, 'assetlinks.json'), assetLinksJson, 'utf8');
    console.log('Saved public/.well-known/assetlinks.json');

    // Write to out/ (static build folder)
    const outWellKnownDir = path.join(rootDir, 'out', '.well-known');
    if (!fs.existsSync(outWellKnownDir)) fs.mkdirSync(outWellKnownDir, { recursive: true });
    fs.writeFileSync(path.join(outWellKnownDir, 'assetlinks.json'), assetLinksJson, 'utf8');
    console.log('Saved out/.well-known/assetlinks.json');

    // 6. Run Bubblewrap Build
    console.log('Starting Bubblewrap TWA Compilation...');
    
    // Inject credentials into environment variables for Bubblewrap
    process.env.BUBBLEWRAP_KEYSTORE_PASSWORD = storepass;
    process.env.BUBBLEWRAP_KEY_PASSWORD = storepass;
    
    // Initialize/Update Android project
    console.log('Updating Android project files...');
    await runCmd('npx bubblewrap update --skipVersionUpgrade', { cwd: path.join(rootDir, 'android') });
 
    // Compile App
    console.log('Compiling signed APK and AAB binaries...');
    await runCmd('npx bubblewrap build --skipPwaValidation', { cwd: path.join(rootDir, 'android') });

    // 6b. Run Bubblewrap Wear OS Build
    console.log('Preparing Wear OS Smartwatch APK target...');
    const androidWearDir = path.join(rootDir, 'android-wear');
    copyFolderSync(path.join(rootDir, 'android'), androidWearDir);
    
    // Modify Manifest for Wear OS
    const wearManifestPath = path.join(androidWearDir, 'app', 'src', 'main', 'AndroidManifest.xml');
    if (fs.existsSync(wearManifestPath)) {
      let manifestXml = fs.readFileSync(wearManifestPath, 'utf8');
      
      // Inject watch features if not already present
      if (!manifestXml.includes('android.hardware.type.watch')) {
        manifestXml = manifestXml.replace('<application', '<uses-feature android:name="android.hardware.type.watch" android:required="true" />\n    <application');
      }
      if (!manifestXml.includes('com.google.android.wearable')) {
        manifestXml = manifestXml.replace('</application>', '    <uses-library android:name="com.google.android.wearable" android:required="false" />\n    </application>');
      }
      
      fs.writeFileSync(wearManifestPath, manifestXml, 'utf8');
      console.log('Wear OS feature keys injected into Manifest.');
    }
    
    console.log('Updating Wear OS Android project files...');
    await runCmd('npx bubblewrap update --skipVersionUpgrade', { cwd: androidWearDir });
    
    console.log('Compiling signed Wear OS APK and AAB binaries...');
    await runCmd('npx bubblewrap build --skipPwaValidation', { cwd: androidWearDir });

    // 7. Copy output binaries to public/app/ and out/app/
    console.log('Copying built app files to web output folders...');
    const publicAppDir = path.join(rootDir, 'public', 'app');
    const outAppDir = path.join(rootDir, 'out', 'app');
    
    if (!fs.existsSync(publicAppDir)) fs.mkdirSync(publicAppDir, { recursive: true });
    if (!fs.existsSync(outAppDir)) fs.mkdirSync(outAppDir, { recursive: true });

    const androidDir = path.join(rootDir, 'android');
    const filesInAndroid = fs.readdirSync(androidDir);
    const apkFile = filesInAndroid.find(f => f.endsWith('-signed.apk'));
    const aabFile = filesInAndroid.find(f => f.endsWith('.aab'));
 
    if (apkFile) {
      fs.copyFileSync(path.join(androidDir, apkFile), path.join(publicAppDir, 'alucalc-release.apk'));
      fs.copyFileSync(path.join(androidDir, apkFile), path.join(outAppDir, 'alucalc-release.apk'));
      console.log(`Copied APK: ${apkFile} -> alucalc-release.apk`);
    } else {
      console.warn('Warning: Signed APK file not found in android directory!');
    }
 
    if (aabFile) {
      fs.copyFileSync(path.join(androidDir, aabFile), path.join(publicAppDir, 'alucalc-release.aab'));
      fs.copyFileSync(path.join(androidDir, aabFile), path.join(outAppDir, 'alucalc-release.aab'));
      console.log(`Copied AAB: ${aabFile} -> alucalc-release.aab`);
    } else {
      console.warn('Warning: AAB file not found in android directory!');
    }

    const filesInWearAndroid = fs.readdirSync(androidWearDir);
    const wearApkFile = filesInWearAndroid.find(f => f.endsWith('-signed.apk'));
    const wearAabFile = filesInWearAndroid.find(f => f.endsWith('.aab'));
    
    if (wearApkFile) {
      fs.copyFileSync(path.join(androidWearDir, wearApkFile), path.join(publicAppDir, 'alucalc-wear-release.apk'));
      fs.copyFileSync(path.join(androidWearDir, wearApkFile), path.join(outAppDir, 'alucalc-wear-release.apk'));
      console.log(`Copied Wear OS APK: ${wearApkFile} -> alucalc-wear-release.apk`);
    } else {
      console.warn('Warning: Signed Wear OS APK not found in android-wear directory!');
    }
    if (wearAabFile) {
      fs.copyFileSync(path.join(androidWearDir, wearAabFile), path.join(publicAppDir, 'alucalc-wear-release.aab'));
      fs.copyFileSync(path.join(androidWearDir, wearAabFile), path.join(outAppDir, 'alucalc-wear-release.aab'));
      console.log(`Copied Wear OS AAB: ${wearAabFile} -> alucalc-wear-release.aab`);
    }

    console.log('===================================================');
    console.log('   App Build Pipeline Completed Successfully!      ');
    console.log('===================================================');

  } finally {
    // Close local server
    server.close();
    console.log('[Server] Local static asset server stopped.');

    // Restore original twa-manifest.json (pointing to production URL)
    if (originalManifestContent) {
      fs.writeFileSync(twaManifestPath, originalManifestContent, 'utf8');
      console.log('twa-manifest.json restored to production configuration.');
    }
  }
}

buildApp().catch(err => {
  console.error('App Build Pipeline Failed:', err);
  process.exit(1);
});
