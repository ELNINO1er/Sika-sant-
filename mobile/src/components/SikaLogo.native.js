import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg/lib/commonjs/elements/Svg';
import Defs from 'react-native-svg/lib/commonjs/elements/Defs';
import LinearGradient from 'react-native-svg/lib/commonjs/elements/LinearGradient';
import Path from 'react-native-svg/lib/commonjs/elements/Path';
import Stop from 'react-native-svg/lib/commonjs/elements/Stop';

// Frontend source: frontend/assets/img/sika-sante-mark.svg
export function SikaLogo({ size = 58, withSurface = true }) {
  const innerSize = Math.round(size * 0.7);

  return (
    <View style={[styles.shell, withSurface && styles.surface, { width: size, height: size, borderRadius: size * 0.34 }]}>
      <Svg width={innerSize} height={innerSize} viewBox="0 0 256 256" fill="none">
        <Defs>
          <LinearGradient id="sikaGradient" x1="38" y1="34" x2="215" y2="220" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#5B9BFF" />
            <Stop offset="0.58" stopColor="#2563EB" />
            <Stop offset="1" stopColor="#4F7DE7" />
          </LinearGradient>
        </Defs>
        <Path
          d="M104 26H154V84H214V134H154V230H104C78.5949 230 58 209.405 58 184V162.5C58 149.521 68.5213 139 81.5 139H104V134H79C56.3563 134 38 115.644 38 93V84H104V26Z"
          fill="url(#sikaGradient)"
        />
        <Path d="M83 125L139 98L117 154L107 132L83 125Z" fill="#FFFFFF" />
      </Svg>
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
    elevation: 4,
  },
});
