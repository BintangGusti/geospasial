// imports
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '~/lib/supabase';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function DetailRumah() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [zoomLevel, setZoomLevel] = useState(15);
  const [data, setData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    alamat_rumah: '',
    status_rumah: '',
    jumlah_kk: '',
    nilai_kesehatan: '',
    nilai_keselamatan: '',
    nilai_komponen: '',
    status_luas: '',
    rumah_sewa: '',
  });
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    const { data: pendingRequest } = await supabase
      .from('gis_data_updaterequest')
      .select('id')
      .eq('id_rumah_id', id)
      .eq('disetujui', false)
      .eq('ditolak', false)
      .limit(1)
      .maybeSingle();

    if (pendingRequest) {
      setData(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('gis_data_rumah')
      .select(`*, gis_data_perumahan(nama_perumahan), maps_geodataset(geometry)`)
      .eq('id_rumah', id)
      .single();

    if (!error && data) {
      setData(data);
      setForm({
        alamat_rumah: data.alamat_rumah,
        status_rumah: data.status_rumah,
        jumlah_kk: data.jumlah_kk?.toString(),
        nilai_kesehatan: data.nilai_kesehatan?.toString(),
        nilai_keselamatan: data.nilai_keselamatan?.toString(),
        nilai_komponen: data.nilai_komponen?.toString(),
        status_luas: data.status_luas,
        rumah_sewa: data.rumah_sewa ? 'Ya' : 'Tidak',
      });

      try {
        const parsed =
          typeof data.maps_geodataset?.geometry === 'string'
            ? JSON.parse(data.maps_geodataset.geometry)
            : data.maps_geodataset?.geometry;
        setGeometry(parsed);
      } catch (e) {
        console.error('Geometry parsing error:', e);
      }

      if (data.photo_rumah) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.photo_rumah);
        setPhotoUrl(urlData.publicUrl);
      }
    }

    setLoading(false);
  };

  const ambilKoordinatUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin ditolak', 'Aplikasi memerlukan izin lokasi.');
      return;
    }

    const lokasi = await Location.getCurrentPositionAsync({});
    const point = {
      type: 'Point',
      coordinates: [lokasi.coords.longitude, lokasi.coords.latitude],
    };
    setGeometry(point);
    Alert.alert('Koordinat ditambahkan', 'Koordinat lokasi Anda berhasil ditambahkan.');
  };

  const centerCoordinate =
    geometry?.type === 'Point'
      ? geometry.coordinates
      : geometry?.type === 'Polygon'
        ? geometry.coordinates[0][0]
        : geometry?.type === 'LineString'
          ? geometry.coordinates[0]
          : [103.964386, 1.103325];

  const handleSubmit = async () => {
    const currentUser = await supabase.auth.getUser();
    const userEmail = currentUser.data.user?.email;

    const diffData = {};
    const formParsed = {
      alamat_rumah: form.alamat_rumah,
      status_rumah: form.status_rumah,
      jumlah_kk: parseInt(form.jumlah_kk),
      nilai_kesehatan: parseInt(form.nilai_kesehatan),
      nilai_keselamatan: parseInt(form.nilai_keselamatan),
      nilai_komponen: parseInt(form.nilai_komponen),
      status_luas: form.status_luas,
      rumah_sewa: form.rumah_sewa === 'Ya',
    };

    // Cek perubahan dan masukkan ke diffData
    if (formParsed.alamat_rumah !== data.alamat_rumah)
      diffData.alamat_rumah = formParsed.alamat_rumah;
    if (formParsed.status_rumah !== data.status_rumah)
      diffData.status_rumah = formParsed.status_rumah;
    if (formParsed.jumlah_kk !== data.jumlah_kk) diffData.jumlah_kk = formParsed.jumlah_kk;
    if (formParsed.nilai_kesehatan !== data.nilai_kesehatan)
      diffData.nilai_kesehatan = formParsed.nilai_kesehatan;
    if (formParsed.nilai_keselamatan !== data.nilai_keselamatan)
      diffData.nilai_keselamatan = formParsed.nilai_keselamatan;
    if (formParsed.nilai_komponen !== data.nilai_komponen)
      diffData.nilai_komponen = formParsed.nilai_komponen;
    if (formParsed.status_luas !== data.status_luas) diffData.status_luas = formParsed.status_luas;
    if (formParsed.rumah_sewa !== data.rumah_sewa) diffData.rumah_sewa = formParsed.rumah_sewa;

    // Tangani geometry
    let geometryString = null;
    if (geometry) {
      geometryString =
        geometry.type === 'Point'
          ? `SRID=4326;POINT (${geometry.coordinates[0]} ${geometry.coordinates[1]})`
          : geometry.type === 'LineString'
            ? `SRID=4326;LINESTRING (${geometry.coordinates
                .map((coord) => `${coord[0]} ${coord[1]}`)
                .join(', ')})`
            : geometry.type === 'Polygon'
              ? `SRID=4326;POLYGON ((${geometry.coordinates[0]
                  .map((coord) => `${coord[0]} ${coord[1]}`)
                  .join(', ')}))`
              : null;

      const existingGeom = data.maps_geodataset?.geometry;
      const existingString = JSON.stringify(existingGeom);
      const newString = JSON.stringify(geometry);
      if (existingString !== newString && geometryString) {
        diffData.geometry = geometryString;
      }
    }

    if (Object.keys(diffData).length === 0) {
      Alert.alert('Tidak Ada Perubahan', 'Tidak ada data yang diubah.');
      return;
    }

    const { geometry: geom, ...otherChanges } = diffData;

    const updatePayload = {
      data: Object.keys(otherChanges).length > 0 ? otherChanges : null,
      ...(geom && { geometry: geom }),
      dibuat_pada: new Date().toISOString(),
      disetujui: false,
      ditolak: false,
      dibuat_oleh_users: userEmail,
      id_rumah_id: data.id_rumah,
    };

    const { error } = await supabase.from('gis_data_updaterequest').insert(updatePayload);

    if (error) {
      Alert.alert('Gagal', 'Permintaan update gagal dikirim.');
      console.error(error);
    } else {
      Alert.alert('Sukses', 'Permintaan update berhasil dikirim dan menunggu persetujuan.');
      router.back();
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#4285F4" />;
  if (!data)
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>
          Data sedang diajukan perubahan dan menunggu persetujuan.
        </Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.mapContainer}>
        <MapboxGL.MapView style={styles.map} logoEnabled={false}>
          <MapboxGL.Camera centerCoordinate={centerCoordinate} zoomLevel={zoomLevel} />
          {geometry?.type === 'Point' && (
            <MapboxGL.PointAnnotation id="point" coordinate={geometry.coordinates} />
          )}
          {geometry?.type === 'LineString' && (
            <MapboxGL.ShapeSource id="lineSource" shape={geometry}>
              <MapboxGL.LineLayer id="lineLayer" style={{ lineColor: '#f00', lineWidth: 3 }} />
            </MapboxGL.ShapeSource>
          )}
          {geometry?.type === 'Polygon' && (
            <MapboxGL.ShapeSource id="polygonSource" shape={geometry}>
              <MapboxGL.FillLayer
                id="polygonFill"
                style={{ fillColor: '#00f', fillOpacity: 0.5 }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>

        {/* Zoom Controls tetap di atas kanan */}
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={() => setZoomLevel((z) => Math.min(z + 1, 20))}>
            <Text style={{ fontSize: 18, padding: 5 }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setZoomLevel((z) => Math.max(z - 1, 1))}>
            <Text style={{ fontSize: 18, padding: 5 }}>-</Text>
          </TouchableOpacity>
        </View>

        {/* 🔽 Tombol Ambil Koordinat di pojok kanan bawah */}
        <TouchableOpacity style={styles.pinButton} onPress={ambilKoordinatUser}>
          <Ionicons name="location-sharp" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />}

      <Text style={styles.title}>{data.nama_pemilik}</Text>
      <Text style={styles.subtitle}>Nama Perumahan: {data.gis_data_perumahan?.nama_perumahan}</Text>

      {Object.entries({
        'Alamat Rumah': 'alamat_rumah',
        'Status Rumah': 'status_rumah',
        'Jumlah KK': 'jumlah_kk',
        'Nilai Kesehatan': 'nilai_kesehatan',
        'Nilai Keselamatan': 'nilai_keselamatan',
        'Nilai Komponen': 'nilai_komponen',
        'Status Luas': 'status_luas',
        'Rumah Sewa (Ya/Tidak)': 'rumah_sewa',
      }).map(([label, key]) => (
        <View key={key} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={form[key]}
            onChangeText={(v) => setForm({ ...form, [key]: v })}
            keyboardType={
              ['jumlah_kk', 'nilai_kesehatan', 'nilai_keselamatan', 'nilai_komponen'].includes(key)
                ? 'numeric'
                : 'default'
            }
          />
        </View>
      ))}

      {/* Cancel + Ajukan Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#aaa' }]}
          onPress={() =>
            Alert.alert('Batalkan Perubahan?', 'Semua data yang belum disimpan akan hilang.', [
              { text: 'Tidak', style: 'cancel' },
              { text: 'Ya, Batalkan', onPress: () => router.back(), style: 'destructive' },
            ])
          }>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1e88e5' }]}
          onPress={() =>
            Alert.alert('Konfirmasi', 'Yakin ingin mengajukan perubahan data ini?', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Ajukan', onPress: handleSubmit },
            ])
          }>
          <Text style={styles.buttonText}>Ajukan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 16 },
  mapContainer: { height: 250, borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  photo: { width: '100%', height: 200, borderRadius: 10, marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { marginBottom: 4, fontSize: 14, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  zoomControls: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  pinButton: {
    position: 'absolute',
    right: 16,
    bottom: 16, // ⬅️ sebelumnya top: 90
    backgroundColor: '#1e88e5',
    borderRadius: 30,
    padding: 12,
    zIndex: 999,
    elevation: 5,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
