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
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '~/lib/supabase';

const screenWidth = Dimensions.get('window').width;

interface Perumahan {
  id: string;
  kecamatan: string;
  kelurahan: string;
  name: string;
  image: any;
  jumlahKK: number;
}

export default function JumlahRLH() {
  const [kecamatan, setKecamatan] = useState<string | null>(null);
  const [kelurahan, setKelurahan] = useState<string | null>(null);
  const [perumahanData, setPerumahanData] = useState<Perumahan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPerumahan();
  }, []);

  const fetchPerumahan = async () => {
    const { data, error } = await supabase.from('gis_data_perumahan').select(`
    id_perumahan,
    nama_perumahan,
    alamat_lengkap_perumahan,
    photo_perumahan,
    gis_data_kecamatan (
      kecamatan
    ),
    gis_data_kelurahan (
      kelurahan
    )
  `);

    if (error) {
      console.error('Gagal mengambil data perumahan:', error);
      setLoading(false);
      return;
    }

    const formatted = data.map((item) => ({
      id: item.id_perumahan.toString(),
      name: item.nama_perumahan,
      kecamatan: item.gis_data_kecamatan?.kecamatan ?? '-',
      kelurahan: item.gis_data_kelurahan?.kelurahan ?? '-',
      jumlahKK: Math.floor(Math.random() * 100),
      image: item.photo_perumahan
        ? {
            uri: supabase.storage.from('media').getPublicUrl(item.photo_perumahan).data.publicUrl,
          }
        : require('../../assets/images/perumahan.jpeg'),
    }));

    setPerumahanData(formatted);
    setLoading(false);
  };

  const kecamatanData = [...new Set(perumahanData.map((item) => item.kecamatan))].map(
    (kecamatan) => ({ value: kecamatan, label: kecamatan })
  );

  const kelurahanData = kecamatan
    ? [
        ...new Set(
          perumahanData.filter((item) => item.kecamatan === kecamatan).map((item) => item.kelurahan)
        ),
      ].map((kelurahan) => ({ value: kelurahan, label: kelurahan }))
    : [];

  const filteredPerumahan = perumahanData.filter((item) => {
    if (!kecamatan && !kelurahan) return true;
    if (!kecamatan) return item.kelurahan === kelurahan;
    if (!kelurahan) return item.kecamatan === kecamatan;
    return item.kecamatan === kecamatan && item.kelurahan === kelurahan;
  });

  const groupByKecamatan = (data: Perumahan[]) => {
    const result: { kecamatan: string; perumahan: Perumahan[] }[] = [];
    const map = new Map();
    for (const item of data) {
      if (!map.has(item.kecamatan)) {
        map.set(item.kecamatan, []);
      }
      map.get(item.kecamatan).push(item);
    }
    for (const [kecamatan, perumahan] of map.entries()) {
      result.push({ kecamatan, perumahan });
    }
    return result;
  };

  const groupedPerumahan = groupByKecamatan(filteredPerumahan);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Memuat data perumahan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Jumlah Rumah</Text>

        <View style={styles.dropdownContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputRowLabel}>Kecamatan:</Text>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                style={styles.dropdown}
                selectedTextStyle={styles.selectedTextStyle}
                placeholderStyle={styles.placeholderStyle}
                value={kecamatan}
                data={kecamatanData}
                valueField="value"
                labelField="label"
                placeholder="-"
                onChange={(e) => {
                  setKecamatan(e.value);
                  setKelurahan(null);
                }}
                search
                searchPlaceholder="Cari Kecamatan..."
                inputSearchStyle={{ height: 40, fontSize: 16 }}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputRowLabel}>Kelurahan:</Text>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                style={styles.dropdown}
                selectedTextStyle={styles.selectedTextStyle}
                placeholderStyle={styles.placeholderStyle}
                value={kelurahan}
                data={kelurahanData}
                valueField="value"
                labelField="label"
                placeholder="-"
                onChange={(e) => setKelurahan(e.value)}
                disable={!kecamatan}
                search
                searchPlaceholder="Cari Kelurahan..."
                inputSearchStyle={{ height: 40, fontSize: 16 }}
              />
            </View>
          </View>

          <Text style={styles.totalText}>
            Total: {filteredPerumahan.length} Perumahan di Seluruh Kota Batam
          </Text>
        </View>

        {groupedPerumahan.map((item, index) => (
          <TouchableOpacity key={index} activeOpacity={1}>
            <Text style={styles.kecamatanHeader}>{item.kecamatan}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {item.perumahan.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/Detail/DetailPerumahan?id=${p.id}`)}
                  style={styles.perumahanCard}>
                  <Image source={p.image} style={styles.image} resizeMode="cover" />
                  <Text style={styles.housingName}>{p.name}</Text>
                  <Text style={styles.housingInfo}>Kecamatan {p.kecamatan}</Text>
                  <Text style={styles.housingInfo}>Kelurahan {p.kelurahan}</Text>
                  <Text style={styles.housingInfo}>Jumlah KK: {p.jumlahKK}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 50,
    right: 50,
    textAlign: 'center',
    top: 10,
  },
  dropdownContainer: {
    width: 200,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'center',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    left: 1,
  },
  inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  inputRowLabel: { fontSize: 10, marginRight: 5, width: 75 },
  dropdownWrapper: { flex: 1 },
  dropdown: {
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 110,
    right: 25,
  },
  placeholderStyle: { fontSize: 10, height: 10 },
  selectedTextStyle: { fontSize: 10, width: 10 },
  totalText: { fontSize: 10, marginTop: 20, fontWeight: '500' },
  backButton: { left: 1, right: 10, top: 30, zIndex: 1 },
  perumahanCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 105,
    elevation: 3,
  },
  image: { width: '100%', height: 60, borderRadius: 6 },
  housingName: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  housingInfo: { fontSize: 6, textAlign: 'center', color: '#555', marginBottom: 2 },
  kecamatanHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
});
