import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Terjadi kesalahan' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.wrap}>
          <Text style={eb.emoji}>😵</Text>
          <Text style={eb.title}>Aplikasi bermasalah</Text>
          <Text style={eb.desc}>
            Maaf, terjadi error tak terduga. Coba muat ulang aplikasi.
          </Text>
          {__DEV__ && this.state.message ? (
            <Text style={eb.debug} numberOfLines={4}>{this.state.message}</Text>
          ) : null}
          <TouchableOpacity style={eb.btn} onPress={this.handleReset} activeOpacity={0.85}>
            <Text style={eb.btnTxt}>Muat Ulang</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emoji: { fontSize: 48 },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  desc: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  debug: {
    color: Colors.error,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: Spacing.sm,
  },
  btn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
