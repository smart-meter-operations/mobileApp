import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants';

const ImageViewerModal = ({ visible, imageUri, onClose }) => {
  if (!visible || !imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Ionicons name="close" size={32} color={COLORS.background} />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUri }}
          style={styles.modalImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '95%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: SPACING.xl + 20, // Adjust for status bar
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: SPACING.xs,
    zIndex: 1,
  },
});

export default ImageViewerModal;