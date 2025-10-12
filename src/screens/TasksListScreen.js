import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../services';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const mapLabelToFilter = (label) => {
  switch (label) {
    case 'Assigned':
      return { status: 'pending' };
    case 'Draft':
      return { status: 'draft' };
    case 'Completed':
      return { status: 'completed' };
    case 'To Sync':
      return { toSync: true };
    default:
      return {};
  }
};

export default function TasksListScreen({ route, navigation }) {
  const { section = 'Consumer Indexing', label = 'Assigned' } = route.params || {};
  const [items, setItems] = useState([]);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: true, title: `${section} - ${label}` });
    
    // For Consumer Indexing, navigate to ConsumerSelectionScreen instead
    if (section === 'Consumer Indexing') {
      navigation.replace('ConsumerSelectionScreen', { section, label });
      return;
    }
    
    load();
  }, [section, label]);

  const load = async () => {
    const filter = mapLabelToFilter(label);
    let list = await DatabaseService.getInstallations(200);
    if (filter.status) {
      list = list.filter((x) => (x.status || '').toLowerCase() === filter.status);
    }
    if (filter.toSync) {
      list = list.filter((x) => x.synced === 0);
    }
    setItems(list);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={{ backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginVertical: 6, borderRadius: 12, padding: SPACING.md }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSizes.lg, fontWeight: TYPOGRAPHY.fontWeights.semibold }}>{item.name}</Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.sm, marginTop: 2 }}>{item.address}</Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.xs, marginTop: 4 }}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  // Don't render anything if we're redirecting to ConsumerSelectionScreen
  if (section === 'Consumer Indexing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: SPACING.sm }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSizes.sm }}>
              Showing {items.length} items
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: COLORS.textSecondary }}>No tasks found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}