import React from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Lightweight markdown: **bold**, newlines. No external deps.
 */
export function MarkdownText({
  children,
  style,
  boldStyle,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
}) {
  const lines = children.split('\n');

  return (
    <Text style={style}>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 ? '\n' : null}
          {parseBold(line, style, boldStyle)}
        </React.Fragment>
      ))}
    </Text>
  );
}

function parseBold(
  line: string,
  baseStyle?: StyleProp<TextStyle>,
  boldStyle?: StyleProp<TextStyle>,
): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) {
    return line;
  }
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[baseStyle, md.bold, boldStyle]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

const md = StyleSheet.create({
  bold: { fontWeight: '800', color: Colors.textPrimary },
});
