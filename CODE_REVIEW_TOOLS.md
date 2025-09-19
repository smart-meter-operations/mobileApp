# Code Review Tools Configuration

This document outlines the code review tools configured for this React Native project.

## 1. ESLint (Static Code Analysis)

ESLint is configured to analyze JavaScript/React Native code for potential errors, style issues, and best practices.

### Configuration Files
- `eslint.config.js` - Main ESLint configuration
- `.prettierrc.js` - Prettier configuration (used by ESLint)

### Key Rules Enabled
- React and React Hooks best practices
- React Native specific rules
- Prettier formatting rules
- Code quality and consistency rules

### Usage
```bash
# Run ESLint to check for issues
npm run lint

# Run ESLint and automatically fix issues
npm run lint -- --fix
```

## 2. Prettier (Code Formatting)

Prettier is configured to automatically format code according to consistent style guidelines.

### Configuration File
- `.prettierrc.js` - Prettier configuration

### Usage
```bash
# Format all files in the src directory
npm run format
```

## 3. Jest (Testing)

Jest is configured for unit testing JavaScript functions and components.

### Configuration File
- `jest.config.js` - Jest configuration

### Usage
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 4. SonarQube Scanner (Static Code Analysis)

SonarQube Scanner provides comprehensive static analysis for code quality, security, and maintainability.

### Configuration Files
- `sonar-project.properties` - SonarQube project configuration
- `scripts/sonar-scanner.js` - SonarQube scanner script

### Usage
```bash
# Run SonarQube analysis (requires SonarQube server)
npm run sonar
```

## Combined Commands

```bash
# Run all code quality checks
npm run code-quality
```

## IDE Integration

Most modern IDEs can be configured to automatically run these tools:

1. **ESLint**: Configure your IDE to use the project's ESLint configuration
2. **Prettier**: Configure your IDE to format on save using Prettier
3. **Jest**: Use Jest plugin/extension for test integration

## CI/CD Integration

These tools should be integrated into your CI/CD pipeline to ensure code quality:

1. Run `npm run code-quality` on every pull request
2. Run `npm test` to ensure all tests pass
3. Run `npm run sonar` for comprehensive code analysis

## Addressing Issues

When these tools report issues:

1. **ESLint warnings/errors**: Fix according to the rule descriptions
2. **Prettier issues**: Run `npm run format` to automatically fix formatting
3. **Jest test failures**: Fix the underlying code or update tests as needed
4. **SonarQube issues**: Address code quality, security, and maintainability issues

## Best Practices

1. Run code quality checks locally before committing
2. Fix issues as soon as they're detected
3. Keep configurations up to date with project needs
4. Regularly review and update tool versions