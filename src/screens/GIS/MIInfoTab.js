import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { miUsers } from './dummydata'; // Using MI users data
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants';

const UserListItem = ({ item }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('TraceMapScreen', { user: item });
  };

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Consumer No: {item.consumerNumber}</Text>
        <Text style={styles.detail}>{item.address}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

export default function MIInfoTab() {
  return (
    <FlatList
      data={miUsers}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <UserListItem item={item} />}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.textPrimary,
  },
  detail: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
