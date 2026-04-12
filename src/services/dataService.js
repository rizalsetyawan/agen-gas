import { db, auth } from './firebase';
export { db };
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  query, 
  where, 
  onSnapshot,
  setDoc,
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// --- CONFIG ULANG UNTUK SECONDARY INSTANCE (Untuk registrasi tanpa logout) ---
const firebaseConfig = {
  apiKey: "AIzaSyDkbN-REj-9EO440zoWiLL5W0WROSfmPqI",
  authDomain: "agen-gas.firebaseapp.com",
  projectId: "agen-gas",
  storageBucket: "agen-gas.firebasestorage.app",
  messagingSenderId: "457757115894",
  appId: "1:457757115894:web:e8f27ed29406fcfdd733d7",
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// --- HELPER UNTUK LABEL STOK ---
export const getStockLabel = (count) => {
  if (count > 50) return { text: "Banyak", color: "#10b981" };
  if (count > 0) return { text: "Terbatas", color: "#f59e0b" };
  return { text: "Habis", color: "#ef4444" };
};

// --- ACCOUNT MANAGEMENT ---
export const registerPangkalanAccount = async (username, password, pangkalanData) => {
  const internalEmail = `${username}@agengas.net`;
  
  try {
    // 1. Create Auth User (Sekali pakai secondaryAuth & secondaryDb)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, internalEmail, password);
    const uid = userCredential.user.uid;

    // 2. Create Pangkalan Doc (Gunakan db utama krn admin sudah login di sini)
    const pangkalanRef = await addDoc(collection(db, 'pangkalan'), {
      ...pangkalanData,
      userId: uid
    });

    // 3. Create User Doc in Firestore (Gunakan db utama)
    await setDoc(doc(db, 'users', uid), {
      email: internalEmail,
      username: username,
      role: 'pangkalan',
      pangkalanId: pangkalanRef.id
    });

    await secondaryAuth.signOut();
    return { success: true, id: pangkalanRef.id };
  } catch (error) {
    console.error("Register Error:", error);
    throw error;
  }
};

// --- PANGKALAN SERVICE ---
export const getPangkalan = async () => {
  const querySnapshot = await getDocs(collection(db, 'pangkalan'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getPangkalanById = async (id) => {
  const docSnap = await getDoc(doc(db, 'pangkalan', id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

// --- ORDERS SERVICE ---
export const createOrder = async (orderData) => {
  // Check for any active orders from exactly this Pangkalan
  const q = query(
    collection(db, 'orders'),
    where('pangkalanId', '==', orderData.pangkalanId),
    where('status', 'in', ['menunggu', 'diproses', 'terkirim_sebagian'])
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
     // We found an active order, let's merge the items instead of duplicate
     const activeOrderDoc = snap.docs[0];
     const activeOrderData = activeOrderDoc.data();
     
     const existingItems = activeOrderData.items || {};
     const newItems = orderData.items || {};
     const mergedItems = { ...existingItems };
     
     // Sum the previous cart and the new cart items
     for (const type of Object.keys(newItems)) {
        mergedItems[type] = (mergedItems[type] || 0) + (newItems[type] || 0);
     }
     
     // Recalculate status correctly based on what was put in trucks so far vs total requested
     const fulfilled = activeOrderData.fulfilledItems || {};
     let allFulfilled = true;
     for (const type of Object.keys(mergedItems)) {
        if ((fulfilled[type] || 0) < mergedItems[type]) {
           allFulfilled = false;
           break;
        }
     }
     
     const hasSomeTruckPacking = Object.values(fulfilled).some(q => q > 0);
     let newStatus = 'menunggu';
     if (allFulfilled) newStatus = 'diproses';
     else if (hasSomeTruckPacking) newStatus = 'terkirim_sebagian';
     
     const orderRef = doc(db, 'orders', activeOrderDoc.id);
     await updateDoc(orderRef, {
        items: mergedItems,
        status: newStatus,
        updatedAt: serverTimestamp()
     });
     
     return orderRef;
  }

  // Create normally if no active order exists
  return await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'menunggu',
    createdAt: serverTimestamp()
  });
};

export const getOrdersByPangkalan = (pangkalanId, callback) => {
  const q = query(collection(db, 'orders'), where('pangkalanId', '==', pangkalanId));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
};

export const getAllOrders = (callback) => {
  return onSnapshot(collection(db, 'orders'), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(orders);
  });
};

export const updateOrderStatus = async (orderId, status) => {
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, { status });
};

// --- STOK SERVICE ---
export const getStock = async () => {
  const querySnapshot = await getDocs(collection(db, 'stock'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateStock = async (stockId, data) => {
  const stockRef = doc(db, 'stock', stockId.toLowerCase());
  await updateDoc(stockRef, data);
};

// --- LOGISTICS: DISPATCH & AUTO-STOCK ---
export const dispatchOrder = async (orderId, deliveryData) => {
  const orderRef = doc(db, 'orders', orderId);
  
  try {
    // 1. Update Order Status
    await updateDoc(orderRef, { status: 'dikirim' });

    // 2. Create Delivery Record
    await addDoc(collection(db, 'deliveries'), {
      ...deliveryData,
      orderId,
      deliveryDate: serverTimestamp()
    });

    // 3. Automate Stock Deduction
    // deliveryData should contain: branchId, gasType, quantity
    const stockId = deliveryData.branchId.toLowerCase();
    const stockRef = doc(db, 'stock', stockId);
    
    // Get current stock
    const stockSnap = await getDocs(query(collection(db, 'stock'), where('branchId', '==', deliveryData.branchId)));
    if (!stockSnap.empty) {
      const currentStock = stockSnap.docs[0].data();
      const gasKey = deliveryData.gasType === '3kg' ? 'gas3kg' : (deliveryData.gasType === '5.5kg' ? 'gas5_5kg' : 'gas12kg');
      
      const newFilled = (currentStock[gasKey]?.filled || 0) - (deliveryData.quantity || 0);
      
      await updateDoc(stockRef, {
        [`${gasKey}.filled`]: Math.max(0, newFilled)
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Dispatch Error:", error);
    throw error;
  }
};

export const getDeliveries = (callback) => {
  return onSnapshot(collection(db, 'deliveries'), (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// --- MULTI-STOP LOGISTICS (RUTE PENGIRIMAN) ---

export const createDeliveryRoute = async (deliveryData, stops) => {
  try {
    // 1. Create Main Delivery Doc
    const deliveryRef = await addDoc(collection(db, 'deliveries'), {
      ...deliveryData,
      status: 'berjalan',
      createdAt: serverTimestamp(),
      stopCount: stops.length,
      completedStops: 0
    });

    // 2. Create Stops
    for (const [index, stop] of stops.entries()) {
      await addDoc(collection(db, 'deliveryStops'), {
        ...stop,
        deliveryId: deliveryRef.id,
        orderIndex: index,
        status: 'menunggu',
        confirmedAt: null
      });
      
      // Update linked order status and partial records if exists
      if (stop.orderId) {
        const orderRef = doc(db, 'orders', stop.orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
           const orderData = orderSnap.data();
           const fulfilled = orderData.fulfilledItems || {};
           
           let allFulfilled = true;
           const newFulfilled = { ...fulfilled };
           
           // Append newly dispatched stop to the tracker
           for (const type of Object.keys(stop.items || {})) {
              newFulfilled[type] = (newFulfilled[type] || 0) + (parseInt(stop.items[type]) || 0);
           }
           
           // Check if EVERYTHING requested has finally been packed into a truck
           for (const type of Object.keys(orderData.items || {})) {
              if ((newFulfilled[type] || 0) < orderData.items[type]) {
                 allFulfilled = false;
              }
           }
           
           await updateDoc(orderRef, { 
              fulfilledItems: newFulfilled, 
              status: allFulfilled ? 'diproses' : 'terkirim_sebagian'
           });
        }
      }
    }

    // 3. Subtract from Agen Stock (Total for all items in all stops)
    const stockId = deliveryData.branchId.toLowerCase();
    const stockRef = doc(db, 'stock', stockId);
    const stockSnap = await getDoc(stockRef);
    
    if (stockSnap.exists()) {
       const currentData = stockSnap.data();
       const updates = {};
       
       for (const stop of stops) {
          // stop.items format: { '3kg': 50, '5.5kg': 10 }
          Object.keys(stop.items || {}).forEach(type => {
             const gasKey = type === '3kg' ? 'gas3kg' : (type === '5.5kg' ? 'gas5_5kg' : 'gas12kg');
             const planned = stop.items[type] || 0;
             if (planned > 0) {
                const currentFilled = (updates[`${gasKey}.filled`] !== undefined ? updates[`${gasKey}.filled`] : (currentData[gasKey]?.filled || 0));
                updates[`${gasKey}.filled`] = Math.max(0, currentFilled - planned);
             }
          });
       }
       if (Object.keys(updates).length > 0) {
          await updateDoc(stockRef, updates);
       }
    }

    return deliveryRef.id;
  } catch (error) {
    console.error("Create Route Error:", error);
    throw error;
  }
};

export const getDeliveryStops = (deliveryId, callback) => {
  const q = query(collection(db, 'deliveryStops'), where('deliveryId', '==', deliveryId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list.sort((a,b) => a.orderIndex - b.orderIndex));
  });
};

export const getActiveStopsForPangkalan = (pangkalanId, callback) => {
  const q = query(collection(db, 'deliveryStops'), where('pangkalanId', '==', pangkalanId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(stop => stop.status === 'menunggu'); // Filter di JS agar tidak butuh Composite Index
    callback(list);
  });
};

export const confirmStopReceipt = async (stopId, receivedItems) => {
  // receivedItems: { '3kg': { actual: 100, empty: 100 }, '5.5kg': { actual: 50, empty: 50 } }
  const stopRef = doc(db, 'deliveryStops', stopId);
  const stopSnap = await getDoc(stopRef);
  
  if (!stopSnap.exists()) throw new Error("Stop not found");
  const stopData = stopSnap.data();

  // 1. Mark stop as finished and log items
  await updateDoc(stopRef, {
    status: 'selesai',
    receivedItems,
    confirmedAt: serverTimestamp()
  });

  // 2. Update Pangkalan Stock
  const pStockId = stopData.pangkalanId;
  const pStockRef = doc(db, 'pangkalanStock', pStockId);
  const pStockSnap = await getDoc(pStockRef);
  const pStockData = pStockSnap.exists() ? pStockSnap.data() : { pangkalanId: pStockId };
  
  const pStockUpdates = { pangkalanId: pStockId };
  
  for (const type of Object.keys(receivedItems)) {
    const gasKey = type === '3kg' ? 'gas3kg' : (type === '5.5kg' ? 'gas5_5kg' : 'gas12kg');
    const { actual, empty } = receivedItems[type];
    
    // Safety check for undefined string inputs
    const actualVal = parseInt(actual) || 0;
    const emptyVal = parseInt(empty) || 0;
    
    const currentP = pStockData[gasKey] || { filled: 0, empty: 0 };
    
    pStockUpdates[gasKey] = {
      filled: (currentP.filled || 0) + actualVal,
      empty: Math.max(0, (currentP.empty || 0) - emptyVal) // Subtracting empty returned to the truck
    };
  }
  
  await setDoc(pStockRef, pStockUpdates, { merge: true });

  // 4. Update Agen Stock (EMPTY TANKS)
  const deliverySnap = await getDoc(doc(db, 'deliveries', stopData.deliveryId));
  if (deliverySnap.exists()) {
    const branchId = deliverySnap.data().branchId;
    const agenStockRef = doc(db, 'stock', branchId.toLowerCase());
    const aSnap = await getDoc(agenStockRef);
    if (aSnap.exists()) {
       const aData = aSnap.data();
       const finalAgenUpdates = {};
       Object.keys(receivedItems).forEach(type => {
          const gasKey = type === '3kg' ? 'gas3kg' : (type === '5.5kg' ? 'gas5_5kg' : 'gas12kg');
          const emptyBack = parseInt(receivedItems[type].empty) || 0;
          if (emptyBack > 0) {
             const currentE = aData[gasKey]?.empty || 0;
             finalAgenUpdates[`${gasKey}.empty`] = currentE + emptyBack;
          }
       });
       if (Object.keys(finalAgenUpdates).length > 0) {
          await updateDoc(agenStockRef, finalAgenUpdates);
       }
    }
  }

  // 5. Update Parent Order Tracking
  if (stopData.orderId) {
    const orderRef = doc(db, 'orders', stopData.orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
       const orderData = orderSnap.data();
       const prevReceivedItems = orderData.receivedItems || {};
       const newReceived = { ...prevReceivedItems };
       
       for (const type of Object.keys(receivedItems)) {
          newReceived[type] = (newReceived[type] || 0) + (parseInt(receivedItems[type].actual) || 0);
       }
       
       let allFullyReceived = true;
       for (const type of Object.keys(orderData.items || {})) {
          if ((newReceived[type] || 0) < orderData.items[type]) {
             allFullyReceived = false;
          }
       }
       
       const orderUpdates = { receivedItems: newReceived };
       if (allFullyReceived) {
          orderUpdates.status = 'selesai';
       }
       
       await updateDoc(orderRef, orderUpdates);
    }
  }

  // 6. Check global delivery status
  const deliveryId = stopData.deliveryId;
  const stopsQuery = await getDocs(query(collection(db, 'deliveryStops'), where('deliveryId', '==', deliveryId)));
  const allFinished = stopsQuery.docs.every(d => d.data().status === 'selesai');
  
  if (allFinished) {
    await updateDoc(doc(db, 'deliveries', deliveryId), { status: 'selesai' });
  }

  return { success: true };
};

// --- SALES SERVICE (B2C: Pangkalan ke Konsumen) ---

export const recordPangkalanSale = async (pangkalanId, pangkalanName, gasType, qty) => {
  try {
    const qtyVal = parseInt(qty);
    const pStockRef = doc(db, 'pangkalanStock', pangkalanId);
    const pStockSnap = await getDoc(pStockRef);
    
    if (!pStockSnap.exists()) {
      throw new Error("Stok pangkalan tidak ditemukan. Harap konfirmasi penerimaan gas terlebih dahulu.");
    }
    
    const currentData = pStockSnap.data()[gasType] || { filled: 0, empty: 0 };
    let currentFilled = typeof currentData === 'object' ? currentData.filled : currentData;
    let currentEmpty = currentData.empty || 0;
    
    // Self-heal corrupted NaN data from previous bug
    if (isNaN(currentFilled) || currentFilled === null) currentFilled = 0;
    if (isNaN(currentEmpty) || currentEmpty === null) currentEmpty = 0;

    if (currentFilled < qtyVal) {
      throw new Error(`Stok isi tidak mencukupi. Sisa stok ${gasType}: ${currentFilled}`);
    }

    // 1. Create Sales Record
    await addDoc(collection(db, 'sales'), {
      pangkalanId,
      pangkalanName,
      gasType,
      quantity: qtyVal,
      createdAt: serverTimestamp()
    });

    // 2. Subtract from Pangkalan Stock & Add to Empty
    await updateDoc(pStockRef, {
      [`${gasType}.filled`]: currentFilled - qtyVal,
      [`${gasType}.empty`]: currentEmpty + qtyVal
    });

    return { success: true };
  } catch (error) {
    console.error("Record Sale Error:", error);
    throw error;
  }
};

export const getSales = (filters = {}, callback) => {
  let q = collection(db, 'sales');
  
  if (filters.pangkalanId) {
    q = query(q, where('pangkalanId', '==', filters.pangkalanId));
  }
  
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
  });
};

// --- SEEDER SCRIPT (Data Awal) ---
export const seedInitialData = async () => {
  const username = prompt("Masukkan Username Admin Baru (Contoh: bos_gas):", "admin");
  const password = prompt("Masukkan Password Admin (min 6 karakter):", "password123");

  if (!username || !password) return;

  try {
    const internalEmail = `${username}@agengas.net`;
    // 1. Create Admin Auth (Secondary)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, internalEmail, password);
    const uid = userCredential.user.uid;

    // 2. Create Admin User Doc (Secondary DB)
    await setDoc(doc(secondaryDb, 'users', uid), {
        email: internalEmail,
        username: username,
        role: 'agen',
        pangkalanId: null
    });

    // 3. Seed Stock (Secondary DB)
    const branches = ['Madiun', 'Nganjuk', 'Ponorogo'];
    for (const branch of branches) {
      await setDoc(doc(secondaryDb, 'stock', branch.toLowerCase()), {
        branchId: branch,
        gas3kg: { filled: 150, empty: 50, damaged: 5 },
        gas5_5kg: { filled: 80, empty: 20, damaged: 2 },
        gas12kg: { filled: 40, empty: 10, damaged: 0 }
      });
    }

    await secondaryAuth.signOut();
    alert(`Setup Selesai! Login dengan username '${username}'.`);
  } catch (error) {
    console.error("Seeding error:", error);
    alert("Error seeding: " + error.message);
  }
};
