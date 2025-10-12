import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { listStyles } from '../styles';
import { COLORS } from '../constants';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return COLORS.success;
    case 'pending':
      return COLORS.error;
    case 'in_progress':
      return COLORS.warning;
    default:
      return COLORS.textMuted;
  }
};

const ListItem = ({
  item,
  onPress,
  showStatus = true,
  style = {},
  children,
}) => {
  return (
    <TouchableOpacity
      style={[listStyles.listItem, style]}
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.7}
    >
      <View style={listStyles.listItemContent}>
        {children || (
          <>
            <Text style={listStyles.listItemName}>{item.name}</Text>
            {item.address && (
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  marginTop: 2,
                }}
              >
                {item.address}
              </Text>
            )}
          </>
        )}
      </View>

      {showStatus && (
        <View style={listStyles.statusContainer}>
          <View
            style={[
              listStyles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const List = ({
  data = [],
  renderItem,
  onItemPress,
  showStatus = true,
  style = {},
  emptyMessage = 'No items available',
  keyExtractor = (item) => item.id,
}) => {
  if (data.length === 0) {
    return (
      <View style={[listStyles.listContainer, style]}>
        <View style={[listStyles.listItem, { justifyContent: 'center' }]}>
          <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[listStyles.listContainer, style]}>
      {data.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;

        return (
          <ListItem
            key={key}
            item={item}
            onPress={onItemPress}
            showStatus={showStatus}
            style={index === data.length - 1 ? { borderBottomWidth: 0 } : {}}
          >
            {renderItem && renderItem(item, index)}
          </ListItem>
        );
      })}
    </View>
  );
};

export { ListItem };
export default List;