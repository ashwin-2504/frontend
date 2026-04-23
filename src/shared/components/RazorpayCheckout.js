import React, { useRef } from 'react';
import { Modal, StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../theme/theme';

const RazorpayCheckout = ({ 
  visible, 
  onClose, 
  orderId, 
  amount, 
  keyId, 
  name = "BharatMandi",
  description = "Fresh Produce Purchase",
  onSuccess,
  onFailure
}) => {
  const webViewRef = useRef(null);

  const razorpayHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <script>
          var options = {
            "key": "${keyId}",
            "amount": "${amount * 100}", // amount in paise
            "currency": "INR",
            "name": "${name}",
            "description": "${description}",
            "order_id": "${orderId}",
            "handler": function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'success',
                data: response
              }));
            },
            "prefill": {
              "name": "",
              "email": "",
              "contact": ""
            },
            "theme": {
              "color": "${theme.COLORS.primary}"
            },
            "modal": {
              "ondismiss": function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'cancelled'
                }));
              }
            }
          };
          var rzp1 = new Razorpay(options);
          rzp1.on('payment.failed', function (response){
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'failure',
              data: response.error
            }));
          });
          rzp1.open();
        </script>
      </body>
    </html>
  `;

  const onMessage = (event) => {
    const response = JSON.parse(event.nativeEvent.data);
    if (response.status === 'success') {
      onSuccess(response.data);
    } else if (response.status === 'cancelled') {
      onClose();
    } else {
      onFailure(response.data);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: razorpayHtml }}
          onMessage={onMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});

export default RazorpayCheckout;
