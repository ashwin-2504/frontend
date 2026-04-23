import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import StyledText from "../components/StyledText";
import { TopBar } from "../components/ScreenActions";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/apiService";
import CustomInput from "../components/CustomInput";
import PrimaryButton from "../components/PrimaryButton";

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [addresses, setAddresses] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingAddressId, setEditingAddressId] = React.useState(null);
  
  // New/Edit address form state
  const [addressForm, setAddressForm] = React.useState({
    label: "",
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
  });

  React.useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAddresses();
      setAddresses(data.data || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({ label: "", fullAddress: "", city: "", state: "", pincode: "" });
    setModalVisible(true);
  };

  const openEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label,
      fullAddress: addr.fullAddress,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    // Sanitize inputs
    const sanitizedForm = {
      label: addressForm.label?.trim(),
      fullAddress: addressForm.fullAddress?.trim(),
      city: addressForm.city?.trim(),
      state: addressForm.state?.trim(),
      pincode: addressForm.pincode?.trim(),
    };

    // Basic validation
    if (!sanitizedForm.label || !sanitizedForm.fullAddress || !sanitizedForm.city || !sanitizedForm.state || !sanitizedForm.pincode) {
      Alert.alert("Error", "Please fill in all address fields");
      return;
    }

    if (sanitizedForm.pincode.length !== 6) {
      Alert.alert("Error", "Pincode must be 6 digits");
      return;
    }

    try {
      let response;
      if (editingAddressId) {
        response = await apiService.updateAddress(editingAddressId, sanitizedForm);
      } else {
        response = await apiService.addAddress(sanitizedForm);
      }
      
      if (response?.user) {
        await updateUser(response.user);
      }

      setModalVisible(false);
      setAddressForm({ label: "", fullAddress: "", city: "", state: "", pincode: "" });
      setEditingAddressId(null);
      await fetchAddresses();
    } catch (error) {
      Alert.alert("Error", error.message || `Failed to ${editingAddressId ? 'update' : 'add'} address`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await apiService.deleteAddress(id);
            if (response?.user) {
              await updateUser(response.user);
            }
            await fetchAddresses();
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete address");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id) => {
    try {
      setLoading(true);
      const response = await apiService.setDefaultAddress(id);
      if (response?.user) {
        await updateUser(response.user);
      }
      await fetchAddresses();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update default address");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };



  const ProfileItem = ({ icon, label, value }) => (
    <View style={styles.profileItem}>
      <View style={styles.iconContainer}>
        <Feather name={icon} size={20} color={theme.COLORS.primary} />
      </View>
      <View style={styles.textContainer}>
        <StyledText variant="caption" color={theme.COLORS.textSecondary}>{label}</StyledText>
        <StyledText variant="bodySecondary" bold color={theme.COLORS.textPrimary}>{value || "Not provided"}</StyledText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="My Profile"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header section with user avatar */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <StyledText variant="display" color={theme.COLORS.white} bold>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </StyledText>
          </View>
          <StyledText variant="screenTitle" bold color={theme.COLORS.textPrimary} style={{ marginBottom: 4 }}>
            {user?.name || "User"}
          </StyledText>
          <View style={styles.roleBadge}>
            <StyledText variant="caption" bold color={theme.COLORS.white} style={{ textTransform: "uppercase" }}>
              {user?.role || "Member"}
            </StyledText>
          </View>
        </View>

        {/* Info list */}
        <View style={[styles.card, theme.SHADOWS.medium]}>
          <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary} style={{ marginBottom: 16 }}>
            Account Details
          </StyledText>
          <View style={styles.divider} />
          
          <ProfileItem icon="mail" label="Email Address" value={user?.email} />
          <ProfileItem icon="phone" label="Phone Number" value={user?.phone} />
          <ProfileItem 
            icon="map-pin" 
            label="Primary Address" 
            value={
              addresses.find(a => a.id === user?.defaultAddressId)?.fullAddress || 
              user?.address || 
              (addresses.length > 0 ? addresses[0].fullAddress : null)
            } 
          />
          <ProfileItem icon="calendar" label="Joined On" value="April 2026" />
        </View>

        {/* Addresses Section */}
        <View style={[styles.card, theme.SHADOWS.medium]}>
          <View style={styles.cardHeader}>
            <StyledText variant="sectionHeader" bold color={theme.COLORS.textPrimary}>Manage Addresses</StyledText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={openAddModal}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={14} color={theme.COLORS.primary} />
              <StyledText variant="caption" bold color={theme.COLORS.primary} style={{ marginLeft: 4 }}>Add New</StyledText>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {loading && addresses.length === 0 ? (
            <ActivityIndicator size="small" color={theme.COLORS.primary} style={{ marginVertical: theme.SPACING.md }} />
          ) : addresses.length === 0 ? (
            <StyledText variant="bodySecondary" color={theme.COLORS.textSecondary} style={{ textAlign: "center", paddingVertical: 24 }}>
              No addresses added yet.
            </StyledText>
          ) : (
            addresses.map((addr) => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.addressInfo}>
                  <View style={styles.labelRow}>
                    <StyledText variant="bodyPrimary" bold>{addr.label}</StyledText>
                    {user?.defaultAddressId === addr.id && (
                      <View style={styles.defaultBadge}>
                        <StyledText variant="caption" bold color={theme.COLORS.white} style={{ fontSize: 9, textTransform: "uppercase" }}>
                          Default
                        </StyledText>
                      </View>
                    )}
                  </View>
                  <StyledText variant="bodySecondary" color={theme.COLORS.textPrimary}>{addr.fullAddress}</StyledText>
                  <StyledText variant="caption" color={theme.COLORS.textSecondary}>{addr.city}, {addr.state} - {addr.pincode}</StyledText>
                </View>
                
                <View style={styles.addressActions}>
                  {user?.defaultAddressId !== addr.id && (
                    <TouchableOpacity 
                      onPress={() => handleSetDefault(addr.id)}
                      style={styles.actionIcon}
                      activeOpacity={0.6}
                      disabled={loading}
                    >
                      <Feather name="check-circle" size={18} color={theme.COLORS.success} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => openEditModal(addr)}
                    style={styles.actionIcon}
                    activeOpacity={0.6}
                    disabled={loading}
                  >
                    <Feather name="edit-2" size={18} color={theme.COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteAddress(addr.id)}
                    style={styles.actionIcon}
                    activeOpacity={0.6}
                    disabled={loading}
                  >
                    <Feather name="trash-2" size={18} color={theme.COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add/Edit Address Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <StyledText variant="screenTitle" bold>{editingAddressId ? 'Edit Address' : 'Add New Address'}</StyledText>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                  <Feather name="x" size={24} color={theme.COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <CustomInput
                  label="Label (e.g. Home, Office)"
                  placeholder="Home"
                  value={addressForm.label}
                  onChangeText={(text) => setAddressForm({ ...addressForm, label: text })}
                />

                <CustomInput
                  label="Full Address"
                  placeholder="Street name, house/flat number"
                  multiline
                  value={addressForm.fullAddress}
                  onChangeText={(text) => setAddressForm({ ...addressForm, fullAddress: text })}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: theme.SPACING.md }}>
                    <CustomInput
                      label="City"
                      placeholder="City"
                      value={addressForm.city}
                      onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="State"
                      placeholder="State"
                      value={addressForm.state}
                      onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
                    />
                  </View>
                </View>

                <CustomInput
                  label="Pincode"
                  placeholder="6-digit pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={addressForm.pincode}
                  onChangeText={(text) => setAddressForm({ ...addressForm, pincode: text })}
                />

                <PrimaryButton
                   title={editingAddressId ? 'Update Address' : 'Save Address'}
                   onPress={handleSaveAddress}
                   loading={loading}
                   style={{ marginTop: 8, marginBottom: 20 }}
                 />
              </ScrollView>
            </View>
          </View>
        </Modal>


        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title="Sign Out"
            variant="destructive"
            onPress={handleLogout}
            icon={<Feather name="log-out" size={18} color={theme.COLORS.error} />}
            accessibilityLabel="Logout"
            accessibilityHint="Signs you out of BharatMandi"
          />
          
          <StyledText variant="caption" color={theme.COLORS.textSecondary} style={{ marginTop: 24 }}>
            Version 1.0.0
          </StyledText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  scrollContent: {
    padding: theme.SPACING.lg,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: theme.SPACING.xl,
    paddingVertical: theme.SPACING.md,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...theme.SHADOWS.medium,
  },
  roleBadge: {
    backgroundColor: theme.COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.BORDER_RADIUS.full,
  },
  card: {
    backgroundColor: theme.COLORS.white,
    borderRadius: theme.BORDER_RADIUS.xl,
    padding: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.COLORS.border,
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.BORDER_RADIUS.md,
    backgroundColor: theme.COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  actionsContainer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.COLORS.error,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.BORDER_RADIUS.lg,
    width: "100%",
    justifyContent: "center",
  },
  logoutIcon: {
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
    minHeight: 32,
  },
  addressCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: theme.BORDER_RADIUS.lg,
    backgroundColor: theme.COLORS.background,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  addressInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: theme.COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    padding: 10,
    marginLeft: 4,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.COLORS.white,
    borderTopLeftRadius: theme.BORDER_RADIUS.xl,
    borderTopRightRadius: theme.BORDER_RADIUS.xl,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: theme.COLORS.background,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: 14,
    color: theme.COLORS.textPrimary,
    minHeight: 48,
  },
  row: {
    flexDirection: "row",
  },
  submitButton: {
    backgroundColor: theme.COLORS.primary,
    padding: 16,
    borderRadius: theme.BORDER_RADIUS.lg,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    ...theme.SHADOWS.medium,
  },
});

export default ProfileScreen;
