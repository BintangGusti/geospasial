import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/* ---------- IMPORT ICONS ---------- */
import HomeIcon from '../../assets/icons/HomeIcon';
import PeopleIcon from '../../assets/icons/PeopleIcon';
import TamanIcon from '../../assets/icons/TamanIcon';

/* ---------- DATA ---------- */
const carouselData = [
  {
    id: '1',
    image: require('../../assets/images/mapbatam.jpeg'),
    title: 'Garis Pantai Kota Batam',
    description: 'Wilayah Garis Pantai Kota Batam',
  },
  {
    id: '2',
    image: require('../../assets/images/mapbatam.jpeg'),
    title: 'Garis Pantai Wilayah Nongsa',
    description: 'Wilayah Garis Pantai Nongsa',
  },
  {
    id: '3',
    image: require('../../assets/images/mapbatam.jpeg'),
    title: 'Garis Pantai Wilayah Sekupang',
    description: 'Wilayah Garis Pantai Sekupang',
  },
];

const gridData = [
  {
    id: '1',
    title: 'Jumlah Perumahan',
    Icon: HomeIcon,
    color: '#34A853',
    route: '/Detail/JumlahPerumahan',
  },
  {
    id: '2',
    title: 'Jumlah Penduduk',
    Icon: PeopleIcon,
  },
  {
    id: '3',
    title: 'Jumlah RLH',
    Icon: HomeIcon,
    color: '#5671B5',
    route: '/Detail/JumlahRLH',
  },
  {
    id: '4',
    title: 'Jumlah RLTH',
    Icon: HomeIcon,
    color: '#CB5A5C',
    route: '/Detail/JumlahRLTH',
  },
  {
    id: '5',
    title: 'Jumlah Rumah Rawan Bencana',
    Icon: HomeIcon,
    color: '#CB5A5C',
    route: '/Detail/JumlahRumahRawanBencana',
  },
  {
    id: '6',
    title: 'Jumlah Rumah Sewa',
    Icon: HomeIcon,
    color: '#AFB255',
    route: '/Detail/JumlahRumahSewa',
  },
  {
    id: '7',
    title: 'Jumlah Unit Rumah',
    Icon: HomeIcon,
    color: '#B255A7',
    route: '/Detail/JumlahUnitRumah',
  },
  {
    id: '8',
    title: 'Persebaran Rumah Liar',
    Icon: HomeIcon,
    color: '#B56456',
    route: '/Detail/PersebaranRumahLiar',
  },
  {
    id: '9',
    title: 'Data Permukiman',
    Icon: HomeIcon,
    color: '#5ACBB8',
    route: '/Detail/DataPermukiman',
  },
  { id: '10', title: 'Data Perumahan', Icon: HomeIcon, color: '#CB5A8D' },
  {
    id: '11',
    title: 'Perumahan Subsidi',
    Icon: HomeIcon,
    color: '#347FA8',
    route: '/Detail/PerumahanSubsidi',
  },
  { id: '12', title: 'Data PSU Perumahan', Icon: HomeIcon, color: '#9734A8' },
  {
    id: '13',
    title: 'Paket Fisik Disperkimtan',
    Icon: HomeIcon,
    color: '#B57156',
  },
  { id: '14', title: 'Data Jalan Lingkungan', Icon: HomeIcon, color: '#3bbb' },
  { id: '15', title: 'Data Taman', Icon: TamanIcon },
];
type GridItemProps = {
  title: string;
  Icon: React.ComponentType<{
    width?: number;
    height?: number;
    color?: string;
  }>; // Tipe ini sesuai dengan HomeIcon yang mendukung props width, height, color
  size: number;
  color?: string;
  onPress: () => void;
  route: string;
};
const GridItem: React.FC<GridItemProps> = React.memo(({ title, Icon, size, color, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[styles.item, { width: size, height: size + 20, borderRadius: size / 2 }]}>
    <View style={styles.iconContainer}>
      <Icon width={size * 0.4} height={size * 0.4} color={color} />
    </View>

    <Text
      style={[styles.itemText, { maxWidth: size * 0.9 }]}
      numberOfLines={2}
      adjustsFontSizeToFit>
      {title}
    </Text>
  </Pressable>
));

const handleGridItemPress = (title: string) => {
  console.log(`Grid item pressed: ${title}`);
  // Add a guard condition to prevent multiple logs if necessary
};
/* ---------- MAIN SCREEN ---------- */
const HomeScreen = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();

  /* CONSTANTS */
  const CARD_W = width * 0.82;
  const CARD_H = CARD_W * 0.75;
  const COLUMNS = 5; // always 5 columns
  const ITEM_SIZE = (width - 8 * (COLUMNS + 1)) / COLUMNS; // 8 = gap
  const scaleFont = (s: number) => s * (width / 300);
  const router = useRouter(); // ✅ Ini benar

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* INI LOGO DAN SELAMAT DATANG */}

        {/*INI BODY */}

        <View style={[styles.topHeader, { paddingHorizontal: width * 0.05 }]}>
          <Image
            source={require('../../assets/images/disperkimtan.jpeg')}
            style={[styles.logo, { width: width * 0.1, height: width * 0.1 }]}
          />
          <View style={styles.logoTextContainer}>
            <Text style={[styles.welcomeText, { fontSize: scaleFont(14) }]}>
              Selamat Datang Grilong
            </Text>
            <Ionicons name="hand-left" size={scaleFont(20)} color="#FFD100" />
          </View>
        </View>
        <Text style={[styles.mapText, { fontSize: scaleFont(15), marginHorizontal: width * 0.05 }]}>
          Map
        </Text>
        {/* INI CAROUSEL */}
        <Animated.FlatList
          data={carouselData}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width}
          // ① ganti friction / inersia
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 1}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          // ② callback tiap 16 ms
          scrollEventThrottle={16}
          // tetap pakai Animated.event
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          renderItem={({ item, index }) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.92, 1, 0.9],
              extrapolate: 'clamp',
            });

            return (
              <View style={[styles.cardWrapper, { width }]}>
                <Animated.View
                  style={[
                    styles.cardContainer,
                    { width: CARD_W, height: CARD_H, transform: [{ scale }] },
                  ]}>
                  <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                  <View style={styles.cardTextContent}>
                    <Text style={[styles.cardTitle, { fontSize: scaleFont(14) }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardDescription, { fontSize: scaleFont(8) }]}>
                      {item.description}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            );
          }}
        />
        {/* INI GRID REKAPAN DATA */}
        <Text style={styles.sectionTitle}>Rekapan Data</Text>
        <View style={[styles.gridContainer, { marginTop: height * 0.05 }]}>
          {gridData.map(({ id, title, Icon, color, route }) => {
            console.log(route); // Cek apakah route ada
            return (
              <GridItem
                key={id}
                title={title}
                Icon={Icon}
                onPress={() => router.push(route)}
                size={ITEM_SIZE}
                color={color}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* Header Styles */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    resizeMode: 'contain',
    top: 5,
  },
  logoTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  welcomeText: {
    top: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },

  /* Text */
  mapText: { fontSize: 14, marginBottom: 10 },

  /* Carousel Styles */
  cardWrapper: { alignItems: 'center' },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImage: { flex: 1, width: '100%' },
  cardTextContent: { padding: 10, alignItems: 'center' },
  cardTitle: {
    fontFamily: 'Poppins_600SemiMedium',
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: 'Poppins',
    textAlign: 'center',
    fontWeight: 'semibold',
  },

  /* Grid Styles */
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Pusatkan isi grid
    alignItems: 'center', // Vertikal rata tengah juga
    gap: 12,
    paddingHorizontal: 10,
  },

  item: {
    margin: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    padding: 5, // Tambahan agar isi lebih fleksibel
  },

  itemText: {
    marginTop: 6,
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    color: '#333',
    maxWidth: 70,
    flexShrink: 1,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
