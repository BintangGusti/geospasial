import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '~/lib/supabase';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || '');

const PROPERTY_LABELS: Record<string, string> = {
  RW: 'RW',
  RT: 'RT',
  Alamat: 'Alamat',
  Lokasi: 'Lokasi',
  Kawasan: 'Kawasan',
  Kecamatan: 'Kecamatan',
  Kelurahan: 'Kelurahan',
  Shape_Leng: 'Panjang',
  Shape_Area: 'Luas',
};

export default function MapsScreen() {
  const [kategoriList, setKategoriList] = useState<string[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [geoData, setGeoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKategoriDropdown, setShowKategoriDropdown] = useState(false);
  const [mapStyle, setMapStyle] = useState(MapboxGL.StyleURL.Street);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android') {
        try {
          const grantedFine = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          const grantedCoarse = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
          );

          if (
            grantedFine !== PermissionsAndroid.RESULTS.GRANTED &&
            grantedCoarse !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            Alert.alert(
              'Izin Ditolak',
              'Aplikasi membutuhkan akses lokasi agar peta dapat ditampilkan.'
            );
          }
        } catch (err) {
          console.warn('Gagal meminta izin lokasi:', err);
        }
      }
    }

    requestPermissions();
  }, []);

  useEffect(() => {
    const fetchKategori = async () => {
      const { data, error } = await supabase.from('distinct_kategori_maps_geodataset').select('*');

      if (error) return console.error('Gagal mengambil kategori:', error);

      const list = Array.from(new Set(data.map((item) => item.kategori).filter(Boolean)));
      setKategoriList(list);
    };
    fetchKategori();
  }, []);

  useEffect(() => {
    if (selectedKategori === 'Unit Rumah') {
      const fetchKecamatan = async () => {
        const { data, error } = await supabase.from('gis_data_kecamatan').select('*');

        if (error) return console.error('Gagal mengambil daftar kecamatan:', error);

        const list = Array.from(new Set(data.map((item) => item.kecamatan).filter(Boolean)));
        setKecamatanList(list);
      };
      fetchKecamatan();
    } else {
      setSelectedKecamatan('');
      setKecamatanList([]);
    }
  }, [selectedKategori]);

  useEffect(() => {
    const fetchGeoData = async () => {
      if (!selectedKategori) return;
      setLoading(true);
      let query = supabase
        .from('maps_geodataset')
        .select('id, geometry,nama_dataset, properties')
        .eq('kategori', selectedKategori);
      if (selectedKategori === 'Unit Rumah' && selectedKecamatan) {
        query = query.eq('nama_dataset', selectedKecamatan);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Gagal mengambil geo data:', error);
        setGeoData([]);
      } else {
        setGeoData(data || []);
      }
      setLoading(false);
    };
    fetchGeoData();
  }, [selectedKategori, selectedKecamatan]);

  const getBounds = () => {
    let minLng = 180,
      minLat = 90,
      maxLng = -180,
      maxLat = -90;
    geoData.forEach((item) => {
      let coords = [];
      switch (item.geometry.type) {
        case 'Polygon':
        case 'MultiLineString':
          coords = item.geometry.coordinates.flat(1);
          break;
        case 'MultiPolygon':
          coords = item.geometry.coordinates.flat(2);
          break;
        case 'LineString':
        case 'MultiPoint':
          coords = item.geometry.coordinates;
          break;
        case 'Point':
          coords = [item.geometry.coordinates];
          break;
      }
      coords.forEach(([lng, lat]) => {
        if (typeof lng === 'number' && typeof lat === 'number') {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      });
    });
    return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
  };

  const features = geoData.map((item) => ({
    type: 'Feature',
    geometry: item.geometry,
    properties: { id: item.id },
  }));

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} styleURL={mapStyle}>
        {geoData.length > 0 && (
          <MapboxGL.Camera
            bounds={{
              ...getBounds(),
              paddingTop: 20,
              paddingBottom: 20,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          />
        )}

        <MapboxGL.ShapeSource
          id="geojson-source"
          shape={{ type: 'FeatureCollection', features }}
          onPress={(e) => {
            const { properties } = e.features[0];
            const selected = geoData.find((item) => item.id === properties.id);
            setSelectedFeature(selected);
            setShowDetailModal(true);
          }}>
          <MapboxGL.FillLayer
            id="fill-layer"
            filter={['==', ['geometry-type'], 'Polygon']}
            style={{ fillColor: 'blue', fillOpacity: 0.5 }}
          />
          <MapboxGL.LineLayer
            id="line-layer"
            filter={['==', ['geometry-type'], 'LineString']}
            style={{ lineColor: 'red', lineWidth: 2 }}
          />
          <MapboxGL.CircleLayer
            id="point-layer"
            filter={['==', ['geometry-type'], 'Point']}
            style={{ circleColor: 'green', circleRadius: 6 }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {/* Tombol Pilih Kategori */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowKategoriDropdown(true)}>
          <Text style={styles.dropdownButtonText}>
            {selectedKategori ? selectedKategori : 'Pilih Kategori'} ⌄
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tombol Layer di kiri bawah */}
      <View style={styles.layerButtonContainer}>
        <TouchableOpacity onPress={() => setShowStyleModal(true)} style={styles.layerButton}>
          <Text style={styles.layerButtonText}>🗺 Layers</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Pilih Kategori */}
      <Modal transparent visible={showKategoriDropdown} animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setShowKategoriDropdown(false)}>
          <View style={styles.dropdownList}>
            <ScrollView>
              {kategoriList.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedKategori(item);
                    setShowKategoriDropdown(false);
                  }}>
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Pilih Tampilan Map (Layer) */}
      <Modal transparent visible={showStyleModal} animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPressOut={() => setShowStyleModal(false)}>
          <View style={styles.dropdownList}>
            {[
              { name: 'Street', value: MapboxGL.StyleURL.Street },
              { name: 'Satellite', value: MapboxGL.StyleURL.Satellite },
              { name: 'Dark', value: MapboxGL.StyleURL.Dark },
            ].map((style) => (
              <TouchableOpacity
                key={style.name}
                style={styles.dropdownItem}
                onPress={() => {
                  setMapStyle(style.value);
                  setShowStyleModal(false);
                }}>
                <Text style={styles.dropdownItemText}>{style.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Kecamatan Picker */}
      {selectedKategori === 'Unit Rumah' && (
        <View style={styles.kecamatanPicker}>
          <Text style={{ fontWeight: 'bold' }}>Pilih Kecamatan</Text>
          <Picker
            selectedValue={selectedKecamatan}
            onValueChange={(value) => setSelectedKecamatan(value)}
            style={{ backgroundColor: '#fff' }}>
            <Picker.Item label="-- Pilih Kecamatan --" value="" />
            {kecamatanList.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      )}

      {/* Loading */}
      {loading && <ActivityIndicator style={styles.loading} />}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailContainer}>
            <ScrollView>
              <Text style={styles.detailTitle}>Detail Data</Text>
              {selectedFeature && (
                <>
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>Nama Dataset:</Text>{' '}
                    {selectedFeature.nama_dataset}
                  </Text>
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>Kategori:</Text> {selectedKategori}
                  </Text>
                  <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Properti:</Text>
                  {selectedFeature.properties ? (
                    Object.entries(selectedFeature.properties).map(([key, value]) => (
                      <Text key={key}>
                        <Text style={{ fontWeight: 'bold' }}>{PROPERTY_LABELS[key] || key}:</Text>{' '}
                        {String(value)}
                      </Text>
                    ))
                  ) : (
                    <Text>Tidak ada properti tambahan.</Text>
                  )}
                </>
              )}
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={{
                  marginTop: 20,
                  backgroundColor: '#007bff',
                  padding: 10,
                  borderRadius: 6,
                }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },

  dropdownButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'flex-start',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    maxHeight: Dimensions.get('window').height / 3,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  kecamatanPicker: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  layerButtonContainer: {
    position: 'absolute',
    top: 50, // sebelumnya bottom
    right: 16, // sebelumnya left
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },

  detailContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    elevation: 5,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
