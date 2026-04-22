import { Image, StyleSheet, View } from 'react-native';

const frontendMarkSvg = `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sikaGradient" x1="38" y1="34" x2="215" y2="220" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5B9BFF"/><stop offset="0.58" stop-color="#2563EB"/><stop offset="1" stop-color="#4F7DE7"/></linearGradient></defs><path d="M104 26H154V84H214V134H154V230H104C78.5949 230 58 209.405 58 184V162.5C58 149.521 68.5213 139 81.5 139H104V134H79C56.3563 134 38 115.644 38 93V84H104V26Z" fill="url(#sikaGradient)"/><path d="M83 125L139 98L117 154L107 132L83 125Z" fill="white"/></svg>`;
const frontendMarkUri = `data:image/svg+xml;utf8,${encodeURIComponent(frontendMarkSvg)}`;

export function SikaLogo({ size = 58, withSurface = true }) {
  return (
    <View style={[styles.shell, withSurface && styles.surface, { width: size, height: size, borderRadius: size * 0.34 }]}>
      <Image source={{ uri: frontendMarkUri }} style={styles.mark} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  mark: {
    width: '72%',
    height: '72%',
    resizeMode: 'contain',
  },
});
