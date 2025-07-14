import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';

const screenWidth = Dimensions.get('window').width;

// ... [import & setup tetap sama]
export default function JumlahUnitRumah() {
  const [geoPerumahan, setGeoPerumahan] = useState<any[]>([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchKecamatan = async () => {
      const { data, error } = await supabase.from('gis_data_kecamatan').select('*');
      if (error) {
        console.error('Gagal mengambil daftar kecamatan:', error);
        return;
      }
      const list = Array.from(
        new Set(data.map((item) => item.kecamatan?.toLowerCase()).filter(Boolean))
      );
      setKecamatanList(list);
    };
    fetchKecamatan();
  }, []);

  useEffect(() => {
    const fetchGeoData = async () => {
      setLoading(true);
      let query = supabase.from('maps_geodataset').select('id, nama_dataset');
      if (selectedKecamatan) {
        query = query.ilike('nama_dataset', selectedKecamatan);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Gagal mengambil data geo:', error);
        setGeoPerumahan([]);
      } else {
        setGeoPerumahan(data || []);
      }
      setLoading(false);
    };
    fetchGeoData();
  }, [selectedKecamatan]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Jumlah Rumah Unit Pemerintah</Text>

          <View style={styles.dropdownContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputRowLabel}>Kecamatan:</Text>
              <View style={styles.dropdownWrapper}>
                <Dropdown
                  style={styles.dropdown}
                  selectedTextStyle={styles.selectedTextStyle}
                  placeholderStyle={styles.placeholderStyle}
                  value={selectedKecamatan}
                  data={kecamatanList.map((k) => ({ label: k, value: k }))}
                  valueField="value"
                  labelField="label"
                  placeholder="-"
                  onChange={(e) => setSelectedKecamatan(e.value)}
                />
              </View>
            </View>

            <Text style={styles.totalText}>Total: {geoPerumahan.length} Unit Rumah Ditemukan</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.cardWrapper}>
              {geoPerumahan.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/Detail/LokasiRumah`)}
                  activeOpacity={0.8}
                  style={styles.perumahanCard}>
                  <Image
                    source={require('../../assets/images/perumahan.jpeg')}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <Text style={styles.housingName}>{item.nama_dataset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffff',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 50,
    textAlign: 'center',
    top: 10,
  },
  dropdownContainer: {
    width: 200,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    left: 3,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputRowLabel: {
    fontSize: 10,
    marginRight: 5,
    width: 75,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdown: {
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 110,
    right: 25,
  },
  placeholderStyle: {
    fontSize: 10,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 8,
  },
  totalText: {
    fontSize: 10,
    color: '#333',
    marginTop: 20,
  },
  backButton: {
    left: 1,
    right: 10,
    top: 30,
    zIndex: 1,
  },
  perumahanCard: {
    width: (screenWidth - 60) / 3,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 130,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  housingName: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },

  housingInfo: {
    fontSize: 6,
    textAlign: 'center',
    color: '#555',
    marginTop: 2,
  },
  cardWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
});
