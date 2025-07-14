import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import MapBangunanPT from '~/components/maps/bangunan_pt_50k';
import MapLubukBaja from '~/components/maps/map_lubuk_baja';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || '');

const mapOptions = [
  { id: 'lubuk_baja', name: 'Lubuk Baja' },
  { id: 'bangunan_pt', name: 'Bangunan PT' },
  // Tambahkan map lainnya di sini jika perlu
];

export default function Home() {
  const [selectedMap, setSelectedMap] = useState('lubuk_baja');
  const [showDropdown, setShowDropdown] = useState(false);

  const renderMap = () => {
    switch (selectedMap) {
      case 'lubuk_baja':
        return <MapLubukBaja />;
      case 'bangunan_pt':
        return <MapBangunanPT />;
      default:
        return null;
    }
  };

  const selectedMapName = mapOptions.find((opt) => opt.id === selectedMap)?.name || 'Pilih Peta';

  return (
    <>
      <Stack.Screen options={{ title: 'Home', headerShown: false }} />

      <View style={styles.container}>
        {/* Dropdown Button */}
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          style={styles.dropdownHeader}
          activeOpacity={0.8}>
          <Text style={styles.dropdownTitle}>{selectedMapName}</Text>
          <Ionicons
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#000"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Dropdown Options */}
        {showDropdown && (
          <View style={styles.dropdownList}>
            {mapOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedMap(option.id);
                  setShowDropdown(false);
                }}>
                <Text style={styles.dropdownItemText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Map */}
        <View style={styles.mapWrapper}>{renderMap()}</View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  dropdownList: {
    backgroundColor: '#f2f2f2',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  mapWrapper: {
    flex: 1,
  },
});
