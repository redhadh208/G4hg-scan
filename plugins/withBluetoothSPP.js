const { withMainApplication } = require('@expo/config-plugins');

function withBluetoothSPP(config) {
  return withMainApplication(config, (config) => {
    // Ajouter l'import
    if (!config.modResults.contents.includes('import com.i10diag.pro.BluetoothSPPPackage;')) {
      config.modResults.contents = config.modResults.contents.replace(
        'import java.util.List;',
        'import java.util.List;\nimport com.i10diag.pro.BluetoothSPPPackage;'
      );
    }

    // Ajouter packages.add(new BluetoothSPPPackage());
    if (!config.modResults.contents.includes('new BluetoothSPPPackage()')) {
      config.modResults.contents = config.modResults.contents.replace(
        'return packages;',
        'packages.add(new BluetoothSPPPackage());\n          return packages;'
      );
    }

    return config;
  });
}

module.exports = withBluetoothSPP;
