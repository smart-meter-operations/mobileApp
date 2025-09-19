const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl: 'http://localhost:9000',
    token: process.env.SONAR_TOKEN,
    options: {
      'sonar.projectKey': 'smov-react-native',
      'sonar.projectName': 'Smart Meter Operations',
      'sonar.projectVersion': '1.0',
      'sonar.sources': 'src',
      'sonar.tests': 'src',
      'sonar.test.inclusions': '**/*.test.js,**/*.test.jsx,**/*.spec.js,**/*.spec.jsx',
      'sonar.exclusions': 'node_modules/**,build/**,dist/**,coverage/**',
      'sonar.sourceEncoding': 'UTF-8',
    },
  },
  () => process.exit()
);