import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const NAGPUR_CENTER = { latitude: 21.0919, longitude: 79.0605 };

const DUMMY_DTRS = [
  {
    id: 'DTR-1001',
    name: 'DTR HB Estate 1',
    code: 'DTR1001',
    address: 'HB Estate, Sonegaon, Nagpur',
    lat: 21.0942,
    lng: 79.0588,
    feeder: { code: 'FDR-201', name: 'Feeder Sonegaon West' },
    substation: { code: 'SS-15', name: 'Sub Station Sonegaon' },
  },
  {
    id: 'DTR-1002',
    name: 'DTR HB Estate 2',
    code: 'DTR1002',
    address: 'Near HB Estate Park, Sonegaon',
    lat: 21.0889,
    lng: 79.0622,
    feeder: { code: 'FDR-201', name: 'Feeder Sonegaon West' },
    substation: { code: 'SS-15', name: 'Sub Station Sonegaon' },
  },
  {
    id: 'DTR-1003',
    name: 'DTR Sonegaon Lake',
    code: 'DTR1003',
    address: 'Sonegaon Lake Road, Nagpur',
    lat: 21.0961,
    lng: 79.0645,
    feeder: { code: 'FDR-202', name: 'Feeder Sonegaon Lake' },
    substation: { code: 'SS-15', name: 'Sub Station Sonegaon' },
  },
  {
    id: 'DTR-1004',
    name: 'DTR HB Estate 3',
    code: 'DTR1004',
    address: 'HB Estate East Gate, Sonegaon',
    lat: 21.0912,
    lng: 79.0557,
    feeder: { code: 'FDR-203', name: 'Feeder Airport Road' },
    substation: { code: 'SS-16', name: 'Sub Station Airport' },
  },
];

export default function DTRSelectorModal({ visible, onClose, onSelect, center = NAGPUR_CENTER }) {
  const [selected, setSelected] = useState(null);
  const [markerLock, setMarkerLock] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const region = useMemo(() => ({
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [center]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select a DTR</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <MapView style={styles.map} initialRegion={region}>
            <Circle
              center={{ latitude: center.latitude, longitude: center.longitude }}
              radius={1000}
              fillColor="rgba(33, 150, 243, 0.08)"
              strokeColor="rgba(33, 150, 243, 0.6)"
            />
            {DUMMY_DTRS.map((dtr) => (
              <Marker
                key={dtr.id}
                coordinate={{ latitude: dtr.lat, longitude: dtr.lng }}
                onPress={() => {
                  if (markerLock) return;
                  setMarkerLock(true);
                  setSelected(dtr);
                  // Release lock shortly to ignore double taps
                  setTimeout(() => setMarkerLock(false), 250);
                }}
              >
                <View style={styles.markerWrap}>
                  <Text style={styles.markerIcon}>⚡</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {selected ? (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{selected.name}</Text>
                <Text style={styles.cardSub}>Code: {selected.code}</Text>
                <Text style={styles.cardSub}>Address: {selected.address}</Text>
                <View style={styles.line} />
                <Text style={styles.cardSub}>Feeder: {selected.feeder.name} ({selected.feeder.code})</Text>
                <Text style={styles.cardSub}>Sub Station: {selected.substation.name} ({selected.substation.code})</Text>
              </View>
              <TouchableOpacity
                style={[styles.selectBtn, selecting && { opacity: 0.6 }]}
                disabled={selecting}
                onPress={() => {
                  if (selecting) return;
                  setSelecting(true);
                  try {
                    onSelect && onSelect({
                      dtrCode: selected.code,
                      dtrName: selected.name,
                      feederCode: selected.feeder.code,
                      feederName: selected.feeder.name,
                      subStationCode: selected.substation.code,
                      subStationName: selected.substation.name,
                    });
                  } finally {
                    setSelected(null);
                    setSelecting(false);
                    onClose && onClose();
                  }
                }}
              >
                <Text style={styles.selectBtnText}>Select</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    height: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#212121' },
  closeBtn: { padding: 8 },
  map: { flex: 1 },
  markerWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  markerIcon: { fontSize: 16, color: '#FFC107', textAlign: 'center' },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eeeeee',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  cardSub: { fontSize: 13, color: '#424242', marginTop: 2 },
  line: { height: 1, backgroundColor: '#eee', marginVertical: 6 },
  selectBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectBtnText: { color: '#fff', fontWeight: '600' },
});
