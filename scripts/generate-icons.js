#!/usr/bin/env node

/**
 * WATTLY App Icon Generation Script
 * 
 * This script provides instructions and utilities for generating
 * the WATTLY app icons from the design specifications.
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = {
  // iOS Icons
  'icon-20.png': 20,
  'icon-29.png': 29,
  'icon-40.png': 40,
  'icon-58.png': 58,
  'icon-60.png': 60,
  'icon-80.png': 80,
  'icon-87.png': 87,
  'icon-120.png': 120,
  'icon-180.png': 180,
  'icon-1024.png': 1024,
  
  // Android Icons
  'icon-48.png': 48,
  'icon-72.png': 72,
  'icon-96.png': 96,
  'icon-144.png': 144,
  'icon-192.png': 192,
  'icon-512.png': 512,
  
  // Main Icons
  'icon.png': 1024,
  'adaptive-icon.png': 1024,
  'favicon.png': 48,
  'splash.png': 1284, // Width for splash screen
};

function generateIconInstructions() {
  console.log('🎨 WATTLY App Icon Generation Instructions\n');
  
  console.log('📋 Required Icon Files:');
  Object.entries(ICON_SIZES).forEach(([filename, size]) => {
    console.log(`   ${filename.padEnd(20)} - ${size}x${size}px`);
  });
  
  console.log('\n🛠️  Recommended Tools:');
  console.log('   • Online: app-icon.co, makeappicon.com');
  console.log('   • Desktop: Adobe Illustrator, Figma, Sketch');
  console.log('   • CLI: imagemagick, sharp-cli');
  
  console.log('\n📐 Design Specifications:');
  console.log('   • Base design: See assets/ICON_DESIGN_SPECS.md');
  console.log('   • Master size: 1024x1024px');
  console.log('   • Format: PNG with transparency');
  console.log('   • Style: Modern electric meter with WATTLY branding');
  
  console.log('\n🎯 Quick Start:');
  console.log('   1. Create 1024x1024px icon following design specs');
  console.log('   2. Use online tool to generate all sizes');
  console.log('   3. Replace files in assets/ directory');
  console.log('   4. Run: expo build or eas build');
  
  console.log('\n💡 Design Elements:');
  console.log('   • Blue gradient background (#1e3a8a to #3b82f6)');
  console.log('   • Electric meter housing (light gray)');
  console.log('   • Digital display with "88888" in green');
  console.log('   • "WATTLY" text in dark blue');
  console.log('   • Connection terminals and LED indicator');
  
  console.log('\n✅ Next Steps:');
  console.log('   • Generate PNG files from SVG design');
  console.log('   • Test icons on actual devices');
  console.log('   • Update app.json if needed');
}

function checkExistingIcons() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const requiredIcons = ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'];
  
  console.log('\n📁 Current Icon Status:');
  requiredIcons.forEach(iconFile => {
    const iconPath = path.join(assetsDir, iconFile);
    const exists = fs.existsSync(iconPath);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${iconFile}`);
    
    if (exists) {
      try {
        const stats = fs.statSync(iconPath);
        console.log(`      Size: ${Math.round(stats.size / 1024)}KB`);
      } catch (e) {
        console.log('      Size: Unknown');
      }
    }
  });
}

// Main execution
if (require.main === module) {
  generateIconInstructions();
  checkExistingIcons();
  
  console.log('\n🚀 Ready to generate your WATTLY app icons!');
  console.log('   Run this script anytime for instructions and status checks.');
}

module.exports = {
  ICON_SIZES,
  generateIconInstructions,
  checkExistingIcons
};
