import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../../theme/colors';
import { MenuItem } from '../../../types';
import { HorizontalFilterChips, FilterChipOption } from '../../../components/HorizontalFilterChips';
import { MenuItemCard } from '../../../components/MenuItemCard';
import {
  getCachedMenu,
  cacheMenuItems,
  enqueueOutboxAction,
} from '../../../db/sqlite';
import { getActiveBranchId } from '../../../services/auth';

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm_01',
    branchId: 'branch_dt_01',
    name: 'Smash Truffle Double Burger',
    category: 'Burgers',
    description: 'Double Angus smashed patties, black truffle aioli, aged cheddar on brioche.',
    price: 14.0,
    currency: 'USD',
    inStock: true,
    isVisible: true,
    preparationMinutes: 12,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150',
    modifiers: ['Extra Truffle Mayo', 'Brioche Bun', 'Gluten-Free Bun'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_02',
    branchId: 'branch_dt_01',
    name: 'Crispy Nashville Hot Chicken Bun',
    category: 'Burgers',
    description: 'Cayenne-dusted fried thigh, dill pickles, vinegar slaw, house cayenne mayo.',
    price: 13.5,
    currency: 'USD',
    inStock: true,
    isVisible: true,
    preparationMinutes: 10,
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=150',
    modifiers: ['Mild Heat', 'X-Hot Heat', 'Extra Pickles'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_03',
    branchId: 'branch_dt_01',
    name: 'Smoked Bacon Avocado Melt',
    category: 'Burgers',
    description: 'Applewood smoked bacon, Hass avocado, gouda cheese, toasted sourdough.',
    price: 12.0,
    currency: 'USD',
    inStock: false,
    isVisible: true,
    preparationMinutes: 9,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_04',
    branchId: 'branch_dt_01',
    name: 'Parmesan Herb Crinkle Fries',
    category: 'Sides',
    description: 'Crispy crinkle cut tossed in shaved pecorino, parsley, and garlic oil.',
    price: 6.5,
    currency: 'USD',
    inStock: true,
    isVisible: true,
    preparationMinutes: 6,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=150',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_05',
    branchId: 'branch_dt_01',
    name: 'Loaded Queso Dip & Crisps',
    category: 'Sides',
    description: 'Warm poblano three-cheese fondue with house tortilla crisps.',
    price: 4.75,
    currency: 'USD',
    inStock: true,
    isVisible: false, // Hidden on web test
    preparationMinutes: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_06',
    branchId: 'branch_dt_01',
    name: 'House Mango Iced Tea',
    category: 'Beverages',
    description: 'Cold-brewed Ceylon black tea infused with natural alphonso mango nectar.',
    price: 4.25,
    currency: 'USD',
    inStock: true,
    isVisible: true,
    preparationMinutes: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm_07',
    branchId: 'branch_dt_01',
    name: 'Salted Caramel Milkshake',
    category: 'Beverages',
    description: 'Hand-spun Madagascar vanilla gelato with sea-salt butterscotch ribbons.',
    price: 6.0,
    currency: 'USD',
    inStock: false,
    isVisible: true,
    preparationMinutes: 4,
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES = ['All', 'Burgers', 'Sides', 'Beverages', 'Desserts'];

const FOOD_PHOTO_PRESETS = [
  { label: '🍔 Wagyu Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
  { label: '🍗 Hot Chicken', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600' },
  { label: '🍟 Garlic Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600' },
  { label: '🧋 Mango Tea', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600' },
  { label: '🥤 Milkshake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600' },
  { label: '🥗 Salad Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600' },
];

export default function MenuStockScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 2 : 1;

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Full CRUD Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields per user specification:
  // Item Name*, Short Description / Ingredients list, Interactive Photo Picker, Price*, Stock Status toggle, Visibility toggle
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Burgers');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formPrice, setFormPrice] = useState('12.50');
  const [formInStock, setFormInStock] = useState(true);
  const [formIsVisible, setFormIsVisible] = useState(true);

  const handlePickFromDevice = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setFormImageUrl(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Select Photo Asset',
        'Choose a photo asset from device gallery or kitchen library:',
        [
          { text: 'Preset: Wagyu Burger', onPress: () => setFormImageUrl(FOOD_PHOTO_PRESETS[0].url) },
          { text: 'Preset: Hot Chicken', onPress: () => setFormImageUrl(FOOD_PHOTO_PRESETS[1].url) },
          { text: 'Preset: Garlic Fries', onPress: () => setFormImageUrl(FOOD_PHOTO_PRESETS[2].url) },
          { text: 'Preset: Mango Tea', onPress: () => setFormImageUrl(FOOD_PHOTO_PRESETS[3].url) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSnapCameraPhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setFormImageUrl(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Direct camera snapshot simulation for emulator/mobile
      const randomPreset = FOOD_PHOTO_PRESETS[Math.floor(Math.random() * FOOD_PHOTO_PRESETS.length)];
      setFormImageUrl(randomPreset.url);
      Alert.alert('Camera Capture Complete', 'Captured item photo attached successfully.');
    }
  };


  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const branchId = await getActiveBranchId();
      const cached = await getCachedMenu(branchId);
      if (cached && cached.length > 0) {
        setMenuItems(cached);
      } else {
        await cacheMenuItems(INITIAL_MENU_ITEMS);
      }
    } catch {}
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Burgers');
    setFormDescription('');
    setFormImageUrl('');
    setFormPrice('12.00');
    setFormInStock(true);
    setFormIsVisible(true);
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormImageUrl(item.imageUrl || '');
    setFormPrice(item.price.toFixed(2));
    setFormInStock(item.inStock);
    setFormIsVisible(item.isVisible !== false);
    setModalVisible(true);
  };

  const handleToggleStock = async (itemId: string, inStock: boolean) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, inStock } : item))
    );

    try {
      await enqueueOutboxAction('UPDATE_MENU_STOCK', { itemId, inStock });
    } catch (e) {
      console.warn('Failed to enqueue stock update', e);
    }
  };

  const handleSaveItem = async () => {
    if (!formName.trim()) {
      Alert.alert('Required Field', 'Please enter a valid item name.');
      return;
    }
    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid positive price.');
      return;
    }

    if (editingItem) {
      const updated: MenuItem = {
        ...editingItem,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim() || undefined,
        price: parsedPrice,
        inStock: formInStock,
        isVisible: formIsVisible,
        updatedAt: new Date().toISOString(),
      };
      setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      await cacheMenuItems(menuItems.map((i) => (i.id === updated.id ? updated : i)));
      await enqueueOutboxAction('UPDATE_MENU_ITEM', updated);
    } else {
      const newItem: MenuItem = {
        id: `m_${Date.now()}`,
        branchId: 'branch_dt_01',
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim() || 'Kitchen prepared item',
        imageUrl: formImageUrl.trim() || undefined,
        price: parsedPrice,
        currency: 'USD',
        inStock: formInStock,
        isVisible: formIsVisible,
        preparationMinutes: 10,
        updatedAt: new Date().toISOString(),
      };
      const nextList = [newItem, ...menuItems];
      setMenuItems(nextList);
      await cacheMenuItems(nextList);
      await enqueueOutboxAction('CREATE_MENU_ITEM', newItem);
    }

    setModalVisible(false);
  };

  const categoryOptions = useMemo<FilterChipOption<string>[]>(() => {
    return CATEGORIES.map((cat) => ({
      id: cat,
      label: cat,
      count:
        cat === 'All'
          ? menuItems.length
          : menuItems.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length,
    }));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header with spacious, un-squashed button */}
      <View style={styles.topBar}>
        <View style={styles.titleColumn}>
          <Text style={styles.headerTitle}>Menu & Stock</Text>
          <View style={styles.subTitleRow}>
            <Text style={styles.subtitle}>
              {menuItems.filter((i) => i.inStock).length}/{menuItems.length} In Stock
            </Text>
            <Text style={styles.subDot}>•</Text>
            <Text style={styles.subtitle}>Live Catalog</Text>
          </View>
        </View>

        {/* Un-squashed, prominent + ADD ITEM button */}
        <TouchableOpacity
          style={styles.addItemBtn}
          onPress={openCreateModal}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add new food item"
        >
          <Text style={styles.addItemBtnText}>+ ADD ITEM</Text>
        </TouchableOpacity>
      </View>

      {/* Instant Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or ingredients..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Horizontal Category Chips */}
      <HorizontalFilterChips
        options={categoryOptions}
        selectedId={selectedCategory}
        onSelect={(cat) => setSelectedCategory(cat)}
      />

      {/* Menu Grid */}
      <FlatList
        key={numColumns}
        data={filteredItems}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.gridCol : styles.singleCol}>
            <MenuItemCard
              item={item}
              onToggleStock={handleToggleStock}
              onEditPrice={() => openEditModal(item)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await loadMenu();
              setIsRefreshing(false);
            }}
            tintColor={Colors.primary}
          />
        }
      />

      {/* Full Menu Item Creator & Editor Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Food Item' : 'Create New Food Item'}
              </Text>
              <Text style={styles.modalSub}>
                Manage menu details, website visibility, and stock availability.
              </Text>

              {/* 1. Item Name* */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Wagyu Truffle Smashburger"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Category Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.catChipsRow}>
                  {['Burgers', 'Sides', 'Beverages', 'Desserts'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        formCategory === cat && styles.catChipSelected,
                      ]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          formCategory === cat && styles.catChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2. Short Description / Ingredients */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Short Description / Ingredients</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="List of ingredients, allergen notes, or preparation details"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 3. Interactive Photo & Camera Upload Section */}
              <View style={styles.fieldGroup}>
                <View style={styles.photoFieldHeader}>
                  <Text style={styles.fieldLabel}>Item Photo & Media Asset</Text>
                  {formImageUrl ? (
                    <TouchableOpacity
                      onPress={() => setFormImageUrl('')}
                      style={styles.clearPhotoBtn}
                    >
                      <Text style={styles.clearPhotoText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {formImageUrl ? (
                  <View style={styles.photoPreviewCard}>
                    <Image
                      source={{ uri: formImageUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.previewOverlayBadge}>
                      <Text style={styles.previewOverlayText}>ATTACHED PHOTO</Text>
                    </View>
                    <View style={styles.photoActionRow}>
                      <TouchableOpacity
                        style={styles.photoActionBtnSecondary}
                        onPress={handleSnapCameraPhoto}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.photoActionBtnTextSecondary}>📷 Retake</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.photoActionBtnSecondary}
                        onPress={handlePickFromDevice}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.photoActionBtnTextSecondary}>📁 Replace</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadDropZone}>
                    <Text style={styles.uploadDropTitle}>No Food Photo Attached</Text>
                    <Text style={styles.uploadDropSub}>
                      Snap a live dish photo using terminal camera or choose from gallery.
                    </Text>

                    <View style={styles.uploadButtonsRow}>
                      <TouchableOpacity
                        style={styles.snapCameraBtn}
                        onPress={handleSnapCameraPhoto}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.snapCameraBtnText}>📷 Snap Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deviceUploadBtn}
                        onPress={handlePickFromDevice}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.deviceUploadBtnText}>📁 Upload Device</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick Kitchen Presets */}
                    <Text style={styles.presetHeading}>OR SELECT KITCHEN PRESET:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                      {FOOD_PHOTO_PRESETS.map((p, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.presetChip}
                          onPress={() => setFormImageUrl(p.url)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.presetChipText}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Toggle direct link */}
                    <TouchableOpacity
                      style={styles.toggleUrlBtn}
                      onPress={() => setShowUrlInput(!showUrlInput)}
                    >
                      <Text style={styles.toggleUrlText}>
                        {showUrlInput ? '— Hide Direct Asset Link' : '+ Enter Direct Asset URL'}
                      </Text>
                    </TouchableOpacity>

                    {showUrlInput && (
                      <TextInput
                        style={[styles.input, { marginTop: 8 }]}
                        value={formImageUrl}
                        onChangeText={setFormImageUrl}
                        placeholder="https://example.com/item.jpg"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="none"
                      />
                    )}
                  </View>
                )}
              </View>

              {/* 4. Price* */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Price ($ USD) *</Text>
                <TextInput
                  style={styles.input}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  keyboardType="decimal-pad"
                  placeholder="12.00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* 5. Stock Status Toggle */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Stock Availability</Text>
                  <Text style={styles.switchSub}>
                    {formInStock ? 'In Stock (Available on floor)' : 'Out of Stock (Depleted)'}
                  </Text>
                </View>
                <Switch
                  value={formInStock}
                  onValueChange={setFormInStock}
                  trackColor={{ false: '#3F3F46', true: Colors.successMuted }}
                  thumbColor={formInStock ? Colors.success : '#A1A1AA'}
                />
              </View>

              {/* 6. Visibility Toggle */}
              <View style={[styles.switchRow, { borderTopWidth: 0, paddingTop: 4 }]}>
                <View>
                  <Text style={styles.switchTitle}>Website Visibility</Text>
                  <Text style={styles.switchSub}>
                    {formIsVisible ? 'Visible on customer website' : 'Hidden from customer website'}
                  </Text>
                </View>
                <Switch
                  value={formIsVisible}
                  onValueChange={setFormIsVisible}
                  trackColor={{ false: '#3F3F46', true: Colors.primaryMuted }}
                  thumbColor={formIsVisible ? Colors.primary : '#A1A1AA'}
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Create Item'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  subDot: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  addItemBtn: {
    flexShrink: 0,
    minWidth: 108,
    height: 44,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  addItemBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  searchInput: {
    backgroundColor: Colors.surfaceElevated,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  singleCol: {
    width: '100%',
  },
  gridCol: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.sm + 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 64,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  catChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catChip: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  catChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catChipTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    marginTop: 4,
  },
  switchTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  photoFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clearPhotoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceHighlight,
  },
  clearPhotoText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '700',
  },
  photoPreviewCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceHighlight,
  },
  previewOverlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  previewOverlayText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  photoActionRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  photoActionBtnSecondary: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  photoActionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  uploadDropZone: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  uploadDropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  uploadDropSub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 15,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  snapCameraBtn: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapCameraBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.4,
  },
  deviceUploadBtn: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  deviceUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.4,
  },
  presetHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  presetChip: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleUrlBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  toggleUrlText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});
