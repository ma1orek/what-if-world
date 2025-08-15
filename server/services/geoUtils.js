const PLACES = [
  // Europa
  { re:/\b(Paris|Île-de-France)\b/i, lat:48.8566, lon:2.3522 },
  { re:/\b(London|UK|Britain)\b/i, lat:51.5074, lon:-0.1278 },
  { re:/\b(Rome|Roma)\b/i, lat:41.9028, lon:12.4964 },
  { re:/\b(Constantinople|Istanbul)\b/i, lat:41.0082, lon:28.9784 },
  { re:/\b(Athens)\b/i, lat:37.9838, lon:23.7275 },
  { re:/\b(Waterloo|Brussels|Belgium)\b/i, lat:50.680, lon:4.412 },
  { re:/\b(Moscow)\b/i, lat:55.7558, lon:37.6173 },
  { re:/\b(Berlin)\b/i, lat:52.5200, lon:13.4050 },
  { re:/\b(Vienna|Wien)\b/i, lat:48.2082, lon:16.3738 },
  { re:/\b(Madrid)\b/i, lat:40.4168, lon:-3.7038 },
  { re:/\b(Lisbon|Lisboa)\b/i, lat:38.7223, lon:-9.1393 },
  { re:/\b(Amsterdam)\b/i, lat:52.3676, lon:4.9041 },
  { re:/\b(Stockholm)\b/i, lat:59.3293, lon:18.0686 },
  { re:/\b(Copenhagen)\b/i, lat:55.6761, lon:12.5683 },
  { re:/\b(Warsaw|Warszawa)\b/i, lat:52.2297, lon:21.0122 },
  { re:/\b(Prague|Praha)\b/i, lat:50.0755, lon:14.4378 },
  { re:/\b(Budapest)\b/i, lat:47.4979, lon:19.0402 },
  { re:/\b(Stalingrad|Volgograd)\b/i, lat:48.708, lon:44.514 },
  { re:/\b(Leningrad|St\.?\s*Petersburg)\b/i, lat:59.9311, lon:30.3609 },
  { re:/\b(Kiev|Kyiv)\b/i, lat:50.4501, lon:30.5234 },
  
  // Bliski Wschód i Afryka
  { re:/\b(Alexandria)\b/i, lat:31.2001, lon:29.9187 },
  { re:/\b(Jerusalem)\b/i, lat:31.7683, lon:35.2137 },
  { re:/\b(Cairo)\b/i, lat:30.0444, lon:31.2357 },
  { re:/\b(Damascus)\b/i, lat:33.5138, lon:36.2765 },
  { re:/\b(Baghdad)\b/i, lat:33.3152, lon:44.3661 },
  { re:/\b(Mecca|Makkah)\b/i, lat:21.3891, lon:39.8579 },
  { re:/\b(Medina)\b/i, lat:24.5247, lon:39.5692 },
  { re:/\b(Carthage)\b/i, lat:36.8531, lon:10.3231 },
  { re:/\b(Timbuktu)\b/i, lat:16.7666, lon:-3.0026 },
  { re:/\b(Casablanca)\b/i, lat:33.5731, lon:-7.5898 },
  
  // Azja
  { re:/\b(Tokyo|Edo)\b/i, lat:35.6762, lon:139.6503 },
  { re:/\b(Beijing|Peking)\b/i, lat:39.9042, lon:116.4074 },
  { re:/\b(Shanghai)\b/i, lat:31.2304, lon:121.4737 },
  { re:/\b(Delhi)\b/i, lat:28.7041, lon:77.1025 },
  { re:/\b(Mumbai|Bombay)\b/i, lat:19.0760, lon:72.8777 },
  { re:/\b(Calcutta|Kolkata)\b/i, lat:22.5726, lon:88.3639 },
  { re:/\b(Bangkok)\b/i, lat:13.7563, lon:100.5018 },
  { re:/\b(Singapore)\b/i, lat:1.3521, lon:103.8198 },
  { re:/\b(Manila)\b/i, lat:14.5995, lon:120.9842 },
  { re:/\b(Saigon|Ho Chi Minh)\b/i, lat:10.8231, lon:106.6297 },
  { re:/\b(Hanoi)\b/i, lat:21.0285, lon:105.8542 },
  { re:/\b(Seoul)\b/i, lat:37.5665, lon:126.9780 },
  { re:/\b(Pyongyang)\b/i, lat:39.0392, lon:125.7625 },
  
  // Ameryki
  { re:/\b(New York|NYC)\b/i, lat:40.7128, lon:-74.0060 },
  { re:/\b(Washington|DC)\b/i, lat:38.9072, lon:-77.0369 },
  { re:/\b(Boston)\b/i, lat:42.3601, lon:-71.0589 },
  { re:/\b(Philadelphia)\b/i, lat:39.9526, lon:-75.1652 },
  { re:/\b(Chicago)\b/i, lat:41.8781, lon:-87.6298 },
  { re:/\b(Los Angeles|LA)\b/i, lat:34.0522, lon:-118.2437 },
  { re:/\b(San Francisco)\b/i, lat:37.7749, lon:-122.4194 },
  { re:/\b(Mexico City)\b/i, lat:19.4326, lon:-99.1332 },
  { re:/\b(Havana|Habana)\b/i, lat:23.1136, lon:-82.3666 },
  { re:/\b(Lima)\b/i, lat:-12.0464, lon:-77.0428 },
  { re:/\b(Buenos Aires)\b/i, lat:-34.6118, lon:-58.3960 },
  { re:/\b(Rio de Janeiro)\b/i, lat:-22.9068, lon:-43.1729 },
  { re:/\b(São Paulo)\b/i, lat:-23.5558, lon:-46.6396 },
  { re:/\b(Brasília)\b/i, lat:-15.8267, lon:-47.9218 },
  
  // Historyczne bitwy i wydarzenia
  { re:/\b(Gettysburg)\b/i, lat:39.8309, lon:-77.2311 },
  { re:/\b(Normandy|D-Day)\b/i, lat:49.3723, lon:-0.7064 },
  { re:/\b(Pearl Harbor)\b/i, lat:21.3099, lon:-157.9219 },
  { re:/\b(Hiroshima)\b/i, lat:34.3853, lon:132.4553 },
  { re:/\b(Nagasaki)\b/i, lat:32.7503, lon:129.8779 },
  { re:/\b(Chernobyl)\b/i, lat:51.2763, lon:30.2218 },
  { re:/\b(Thermopylae)\b/i, lat:38.7968, lon:22.5361 },
  { re:/\b(Marathon)\b/i, lat:38.1462, lon:23.9608 },
  { re:/\b(Hastings)\b/i, lat:50.8550, lon:0.5736 },
  { re:/\b(Agincourt)\b/i, lat:50.4667, lon:2.1333 },
  { re:/\b(Austerlitz)\b/i, lat:49.1378, lon:16.9442 },
  { re:/\b(Borodino)\b/i, lat:55.5167, lon:35.8167 },
  { re:/\b(Verdun)\b/i, lat:49.1590, lon:5.3883 },
  { re:/\b(Somme)\b/i, lat:49.9167, lon:2.9333 },
  
  // Oceania i inne
  { re:/\b(Sydney)\b/i, lat:-33.8688, lon:151.2093 },
  { re:/\b(Melbourne)\b/i, lat:-37.8136, lon:144.9631 },
  { re:/\b(Auckland)\b/i, lat:-36.8485, lon:174.7633 },
  { re:/\b(Wellington)\b/i, lat:-41.2865, lon:174.7762 },
  
  // Regiony i krainy
  { re:/\b(Sahara)\b/i, lat:23.4162, lon:25.6628 },
  { re:/\b(Siberia)\b/i, lat:60.0000, lon:105.0000 },
  { re:/\b(Amazon)\b/i, lat:-3.4653, lon:-62.2159 },
  { re:/\b(Himalaya)\b/i, lat:28.0000, lon:84.0000 },
  { re:/\b(Alps)\b/i, lat:46.5197, lon:10.4017 },
  { re:/\b(Andes)\b/i, lat:-13.1631, lon:-72.5450 },
  { re:/\b(Gobi)\b/i, lat:42.5000, lon:106.0000 },
];

function isValidLatLon([lat, lon]) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function snapFromText(text) {
  for (const p of PLACES) {
    if (p.re.test(text)) return [p.lat, p.lon];
  }
  return null;
}

module.exports = { isValidLatLon, snapFromText, PLACES };