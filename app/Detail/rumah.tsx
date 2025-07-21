import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { supabase } from '~/lib/supabase';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || '');
MapboxGL.setTelemetryEnabled(false);

const NON_EDITABLE_FIELDS = [
  'status_rumah',
  'status_luas',
  'nilai_kesehatan',
  'nilai_keselamatan',
  'nilai_komponen',
];

export default function DetailRumahScreen() {
  const { id } = useLocalSearchParams();
  const [rumah, setRumah] = useState<any>(null);
  const [geometry, setGeometry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formEdit, setFormEdit] = useState({
    nama_pemilik: '',
    alamat_rumah: '',
    status_rumah: '',
    jumlah_kk: '',
    nilai_kesehatan: '',
    nilai_keselamatan: '',
    nilai_komponen: '',
    status_luas: '',
    rumah_sewa: '',
  });
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [perumahanItems, setPerumahanItems] = useState([]);
  const [perumahanList, setPerumahanList] = useState([]);

  useEffect(() => {
    fetchPerumahan();
  }, []);

  const fetchPerumahan = async () => {
    const { data, error } = await supabase.from('gis_data_perumahan').select(`
      id_perumahan,
      nama_perumahan
    `);

    if (!error) {
      setPerumahanList(data);
      const items = data.map((item) => ({
        label: item.nama_perumahan,
        value: item.id_perumahan.toString(),
      }));
      setPerumahanItems(items);
    }
  };

  const checkUpdateStatus = async () => {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;

    if (!email || !id) return;

    const { data, error } = await supabase
      .from('gis_data_updaterequest')
      .select('*')
      .eq('id_rumah_id', id)
      .eq('dibuat_oleh_users', email)
      .eq('disetujui', false)
      .eq('ditolak', false);

    if (!error && data && data.length > 0) {
      setPendingUpdate(true);
    }
  };

  const [newPhotoPath, setNewPhotoPath] = useState<string | null>(null);
  const [newCoords, setNewCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (id) fetchDetailRumah();
    checkUpdateStatus();
  }, [id]);

  const fetchDetailRumah = async () => {
    try {
      const { data, error } = await supabase
        .from('gis_data_rumah')
        .select(
          `
    *,
    maps_geodataset:geo_id (geometry),
    gis_data_perumahan:nama_perumahan_id (
      nama_perumahan,
      kecamatan: kecamatan_id (kecamatan),
      kelurahan: kelurahan_id (kelurahan)
    )
  `
        )
        .eq('id_rumah', id)
        .single();

      if (error) {
        console.error('Error fetching detail:', error);
      } else {
        setRumah(data);
        setGeometry(data.maps_geodataset?.geometry);
        setFormEdit({
          nama_pemilik: data.nama_pemilik,
          alamat_rumah: data.alamat_rumah,
          status_rumah: data.status_rumah,
          jumlah_kk: data.jumlah_kk?.toString(),
          nilai_kesehatan: data.nilai_kesehatan?.toString(),
          nilai_keselamatan: data.nilai_keselamatan?.toString(),
          nilai_komponen: data.nilai_komponen?.toString(),
          status_luas: data.status_luas,
          rumah_sewa: data.rumah_sewa ? 'Ya' : 'Tidak',
        });
      }
    } catch (e) {
      console.error('Unexpected error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setNewPhotoPath(asset.uri);
      Alert.alert('Foto baru dipilih');
    }
  };

  const handlePickCoordinate = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin lokasi ditolak');
      return;
    }

    const lokasi = await Location.getCurrentPositionAsync({});
    const coords: [number, number] = [lokasi.coords.longitude, lokasi.coords.latitude];
    setNewCoords(coords);
    setGeometry({ type: 'Point', coordinates: coords });
    Alert.alert('Koordinat berhasil diambil');
  };

  const handlePointPress = async () => {
    try {
      const { data, error } = await supabase
        .from('maps_geodataset')
        .select('*')
        .eq('id', rumah.geo_id)
        .single();

      if (error) {
        console.error('Error fetching maps_geodataset:', error);
      } else {
        setGeoData(data);
        setModalVisible(true);
      }
    } catch (e) {
      console.error('Unexpected error:', e);
    }
  };

  const handleDownloadPDF = async () => {
    if (!rumah || !geometry) return;

    const MAPBOX_KEY =
      'sk.eyJ1IjoidGl5b3NhcHV0cmE4NCIsImEiOiJjbWJ5endlYnMxM3N6MmtzNnlqbXdnb281In0.zB0jVrNstagQSA8zhglAoQ';

    let staticMapUrl = '';
    let center: [number, number] = [0, 0];

    if (geometry.type === 'Point') {
      center = geometry.coordinates;
      staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${center[0]},${center[1]})/${center[0]},${center[1]},16,0/600x300?access_token=${MAPBOX_KEY}`;
    } else if (geometry.type === 'Polygon') {
      const polygonCoords: [number, number][] = geometry.coordinates[0];
      const pathString = polygonCoords.map((coord) => `${coord[0]},${coord[1]}`).join(';');
      const avgLng = polygonCoords.reduce((sum, c) => sum + c[0], 0) / polygonCoords.length;
      const avgLat = polygonCoords.reduce((sum, c) => sum + c[1], 0) / polygonCoords.length;
      center = [avgLng, avgLat];
      staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/path-2+ff0000+000000(${pathString})/${center[0]},${center[1]},15/600x300?access_token=${MAPBOX_KEY}`;
    } else {
      Alert.alert('Gagal', 'Tipe geometry belum didukung.');
      return;
    }

    const fileName = rumah.photo_rumah?.split('/').pop(); // ambil nama file saja
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(`rumah_photo/${fileName}`);
    const photoUrl = publicUrlData?.publicUrl;

    const htmlContent = `
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        font-size: 13px;
        color: #333;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 15px;
      }
      .image-box {
        flex: 1;
        border: 1px solid #ccc;
        padding: 4px;
      }
      .image-box img {
        width: 100%;
        max-height: 180px;
        object-fit: cover;
      }
      .section {
        margin-bottom: 12px;
      }
      .section h2 {
        font-size: 14px;
        margin-bottom: 6px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 3px;
      }
      p {
        margin: 2px 0;
      }
      pre {
        font-size: 10px;
        background-color: #f4f4f4;
        padding: 8px;
        overflow-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <h2 style="text-align:center;">Detail Rumah</h2>

    <div class="row">
      <div class="image-box">
        <h2 style="text-align:center;">Foto Rumah</h2>
        <img src="${photoUrl}" alt="Foto Rumah" />
      </div>
      <div class="image-box">
        <h2 style="text-align:center;">Peta Lokasi</h2>
        <img src="${staticMapUrl}" alt="Peta Lokasi" />
      </div>
    </div>

    <div class="section">
      <h2>Informasi Rumah</h2>
      <p><strong>Nama Pemilik:</strong> ${rumah.nama_pemilik}</p>
      <p><strong>Status Rumah:</strong> ${rumah.status_rumah}</p>
      <p><strong>Alamat:</strong> ${rumah.alamat_rumah}</p>
      <p><strong>Status Luas Rumah:</strong> ${rumah.status_luas}</p>
      <p><strong>Jumlah KK:</strong> ${rumah.jumlah_kk}</p>
      <p><strong>Rumah:</strong> ${rumah.rumah_sewa ? 'Sewa' : 'Milik Sendiri'}</p>
      <p><strong>Nilai Kesehatan:</strong> ${rumah.nilai_kesehatan}</p>
      <p><strong>Nilai Keselamatan:</strong> ${rumah.nilai_keselamatan}</p>
      <p><strong>Nilai Komponen:</strong> ${rumah.nilai_komponen}</p>
    </div>

    ${
      geoData
        ? `<div class="section">
            <h2>Detail Geo Dataset</h2>
            <p><strong>Nama Dataset:</strong> ${geoData.nama_dataset}</p>
            <p><strong>Kategori:</strong> ${geoData.kategori}</p>
            <p><strong>Pending:</strong> ${geoData.pending ? 'Ya' : 'Tidak'}</p>
            <p><strong>Properties:</strong></p>
            <pre>${JSON.stringify(geoData.properties, null, 2)}</pre>
          </div>`
        : ''
    }
  </body>
</html>
`;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      const newPath = FileSystem.documentDirectory + `detail_rumah_${rumah.id_rumah}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newPath });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath);
      } else {
        Alert.alert('Berhasil', `PDF disimpan di:\n${newPath}`);
      }
    } catch (error) {
      console.error('Gagal membuat PDF:', error);
      Alert.alert('Gagal', 'Tidak dapat membuat file PDF');
    }
  };

  const handleSubmitEdit = async () => {
    const currentUser = await supabase.auth.getUser();
    const userEmail = currentUser.data.user?.email;

    const diffData: any = {};
    const formParsed = {
      nama_pemilik: formEdit.nama_pemilik,
      alamat_rumah: formEdit.alamat_rumah,
      jumlah_kk: parseInt(formEdit.jumlah_kk),
      rumah_sewa: formEdit.rumah_sewa === 'Ya',
    };

    if (formParsed.nama_pemilik !== rumah.nama_pemilik)
      diffData.nama_pemilik = formParsed.nama_pemilik;
    if (formParsed.alamat_rumah !== rumah.alamat_rumah)
      diffData.alamat_rumah = formParsed.alamat_rumah;

    if (formParsed.jumlah_kk !== rumah.jumlah_kk) diffData.jumlah_kk = formParsed.jumlah_kk;

    if (formParsed.rumah_sewa !== rumah.rumah_sewa) diffData.rumah_sewa = formParsed.rumah_sewa;

    // CEK: Jika tidak ada perubahan data & foto & koordinat, batalkan
    const noChange = Object.keys(diffData).length === 0 && !newPhotoPath && !newCoords;

    if (noChange) {
      Alert.alert('Tidak Ada Perubahan', 'Tidak ada data yang diubah.');
      return;
    }

    const updatePayload: any = {
      data: diffData,
      dibuat_pada: new Date().toISOString(),
      disetujui: false,
      ditolak: false,
      dibuat_oleh_users: userEmail,
      id_rumah_id: rumah.id_rumah,
    };

    if (newPhotoPath) {
      const fileExt = newPhotoPath.split('.').pop();
      const fileName = `rumah_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(`rumah_photo/${fileName}`, {
          uri: newPhotoPath,
          type: 'image/jpeg',
          name: fileName,
        } as any);

      if (uploadError) {
        Alert.alert('Gagal Upload Foto', uploadError.message);
        return;
      }

      updatePayload.photo_rumah = `rumah_photo/${fileName}`;
    }

    if (newCoords) {
      updatePayload.geometry = {
        type: 'Point',
        coordinates: newCoords,
      };
    }

    const { error } = await supabase.from('gis_data_updaterequest').insert(updatePayload);

    if (error) {
      Alert.alert('Gagal', 'Permintaan update gagal dikirim.');
      console.error(error);
    } else {
      Alert.alert('Sukses', 'Permintaan update berhasil dikirim dan menunggu persetujuan.');
      setIsEditMode(false);
      setNewCoords(null);
      setNewPhotoPath(null);
    }
  };

  const renderInput = (label: string, field: string) => {
    const isNonEditableField = NON_EDITABLE_FIELDS.includes(field);
    const isEditable = isEditMode && !isNonEditableField;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            isEditMode &&
              isNonEditableField && {
                backgroundColor: '#e0e0e0',
                color: '#999',
              },
          ]}
          value={isEditMode ? formEdit[field]?.toString() || '' : rumah[field]?.toString() || ''}
          editable={isEditable}
          onChangeText={(v) => {
            if (isEditable) setFormEdit({ ...formEdit, [field]: v });
          }}
        />
        {isEditMode && isNonEditableField && (
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>* Tidak dapat diedit</Text>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (!rumah) {
    return (
      <View style={styles.center}>
        <Text>Data tidak ditemukan</Text>
      </View>
    );
  }

  let coords: [number, number] = [0, 0];
  if (geometry?.type === 'Point') {
    coords = geometry.coordinates;
  } else if (geometry?.type === 'Polygon') {
    coords = geometry.coordinates[0][0];
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {pendingUpdate && (
          <Pressable
            onPress={() => router.push(`/update/detail?id=${id}`)}
            style={{
              backgroundColor: '#fff3cd',
              borderLeftWidth: 4,
              borderLeftColor: '#ffc107',
              padding: 12,
              marginBottom: 16,
            }}>
            <Text style={{ color: '#856404' }}>
              ⚠️ Anda sudah mengajukan perubahan. Klik di sini untuk melihat detail permintaan
              update.
            </Text>
          </Pressable>
        )}

        {renderInput('Nama Pemilik', 'nama_pemilik')}
        {renderInput('Status Rumah', 'status_rumah')}
        {renderInput('Alamat Rumah', 'alamat_rumah')}
        {renderInput('Status Luas Rumah', 'status_luas')}
        {renderInput('Jumlah KK', 'jumlah_kk')}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Perumahan</Text>
          {isEditMode ? (
            <DropDownPicker
              open={dropdownOpen}
              setOpen={setDropdownOpen}
              value={formEdit.perumahan}
              setValue={(valFn) =>
                setFormEdit((prev) => ({
                  ...prev,
                  perumahan: valFn(prev.perumahan),
                }))
              }
              items={perumahanItems}
              setItems={setPerumahanItems}
              placeholder="Pilih Perumahan"
              listMode="MODAL"
              zIndex={1000}
              zIndexInverse={1000}
            />
          ) : (
            <Text style={styles.input}>{rumah?.gis_data_perumahan?.nama_perumahan || '-'}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kecamatan</Text>
          <Text style={styles.input}>{rumah?.gis_data_perumahan?.kecamatan?.kecamatan || '-'}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kelurahan</Text>
          <Text style={styles.input}>{rumah?.gis_data_perumahan?.kelurahan?.kelurahan || '-'}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rumah</Text>
          {isEditMode ? (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formEdit.rumah_sewa}
                onValueChange={(value) => setFormEdit({ ...formEdit, rumah_sewa: value })}
                style={styles.picker}>
                <Picker.Item label="Milik Sendiri" value="Tidak" />
                <Picker.Item label="Sewa" value="Ya" />
              </Picker>
            </View>
          ) : (
            <Text style={styles.input}>
              {formEdit.rumah_sewa === 'Ya' ? 'Sewa' : 'Milik Sendiri'}
            </Text>
          )}
        </View>

        {renderInput('Nilai Kesehatan', 'nilai_kesehatan')}
        {renderInput('Nilai Keselamatan', 'nilai_keselamatan')}
        {renderInput('Nilai Komponen', 'nilai_komponen')}

        <Text style={styles.label}>Foto Rumah</Text>
        <Image
          source={{
            uri: newPhotoPath
              ? newPhotoPath
              : supabase.storage.from('media').getPublicUrl(rumah.photo_rumah).data.publicUrl,
          }}
          style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 16 }}
          resizeMode="cover"
        />
        {newPhotoPath && (
          <Text style={{ fontStyle: 'italic', marginBottom: 8, color: 'green' }}>
            * Foto baru telah dipilih
          </Text>
        )}

        <Text style={styles.label}>Lokasi Rumah</Text>
        <View style={styles.mapContainer}>
          <MapboxGL.MapView style={styles.map}>
            <MapboxGL.Camera zoomLevel={16} centerCoordinate={coords} />
            <MapboxGL.PointAnnotation
              id="rumah"
              coordinate={coords}
              onSelected={handlePointPress}
            />
          </MapboxGL.MapView>
        </View>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detail Geo Dataset</Text>
              {geoData ? (
                <>
                  <Text>Nama Dataset: {geoData.nama_dataset}</Text>
                  <Text>Kategori: {geoData.kategori}</Text>
                  <Text>Pending: {geoData.pending ? 'Ya' : 'Tidak'}</Text>
                  <Text>Properties:</Text>
                  <Text style={{ fontSize: 12 }}>
                    {JSON.stringify(geoData.properties, null, 2)}
                  </Text>
                </>
              ) : (
                <Text>Loading...</Text>
              )}
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={{ color: '#fff' }}>Tutup</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Download PDF</Text>
        </TouchableOpacity>
        {isEditMode && (
          <>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: '#f57c00' }]}
              onPress={handlePickImage}>
              <Text style={styles.buttonText}>Ganti Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: '#6a1b9a' }]}
              onPress={handlePickCoordinate}>
              <Text style={styles.buttonText}>Ambil Koordinat Baru</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          disabled={pendingUpdate}
          style={[
            styles.downloadButton,
            { backgroundColor: pendingUpdate ? '#aaa' : isEditMode ? '#388e3c' : '#009688' },
          ]}
          onPress={() => {
            if (pendingUpdate) return;
            if (isEditMode) {
              Alert.alert('Ajukan Perubahan?', 'Data akan diajukan untuk perubahan.', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Ajukan', onPress: handleSubmitEdit },
              ]);
            } else {
              setIsEditMode(true);
            }
          }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {pendingUpdate ? 'Menunggu Persetujuan' : isEditMode ? 'Ajukan Perubahan' : 'Edit Data'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  inputGroup: { marginBottom: 12 },
  label: { fontWeight: 'bold', color: '#333', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    color: '#333',
    backgroundColor: '#f5f5f5',
  },
  scrollContent: { paddingBottom: 30 },
  mapContainer: { height: 300, marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  modalClose: {
    marginTop: 20,
    backgroundColor: '#1e88e5',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  downloadButton: {
    marginTop: 20,
    backgroundColor: '#1e88e5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleEdit: {
    backgroundColor: '#009688',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
