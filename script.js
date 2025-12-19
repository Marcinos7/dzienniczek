const KATEGORIE_UWAG = [
  "wypełnianie obowiązków ucznia",
  "zaangażowanie społeczne",
  "kultura osobista",
  "dbałość o bezpieczeństwo i zdrowie",
  "szacunek do innych osób",
  "zachowanie na lekcji"
];

// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCpZFyGA92f5600MVKWYhOsJ0eXhKAN0DA",
    authDomain: "dzienniczek-a488a.firebaseapp.com",
    projectId: "dzienniczek-a488a",
    storageBucket: "dzienniczek-a488a.firebasestorage.app",
    messagingSenderId: "194419034610",
    appId: "1:194419034610:web:132c6597ce9b750896436b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementy DOM
const loginDiv = document.getElementById('loginDiv');
const dziennikDiv = document.getElementById('dziennikDiv');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const userName = document.getElementById('userName');
const klasaSelect = document.getElementById('klasaSelect');
const zaladujKlaseBtn = document.getElementById('zaladujKlase');
const paneleDiv = document.getElementById('panele');
const panelContent = document.getElementById('panelContent');
const panelBtns = document.querySelectorAll('.panelBtn');

let aktualnaKlasa = null;

// Logowanie
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(userCred => loadTeacherData(userCred.user.uid))
        .catch(err => loginError.textContent = err.message);
});

// Wylogowanie
logoutBtn.addEventListener('click', () => auth.signOut().then(()=>location.reload()));

function loadTeacherData(uid) {
    db.collection("nauczyciele").doc(uid).get().then(doc => {
        if (!doc.exists) { alert("Brak danych nauczyciela!"); return; }

        const data = doc.data();
        userName.textContent = data.imie || "Nauczyciel";

        loginDiv.style.display = 'none';
        dziennikDiv.style.display = 'block';

        // Ładowanie wszystkich klas
        klasaSelect.innerHTML = '<option value="">-- Wybierz --</option>';
        db.collection("klasy").get().then(snapshot => {
            snapshot.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().nazwa || doc.id;
                klasaSelect.appendChild(opt);
            });
        });
    }).catch(err => console.error("Błąd:", err));
}

// Załaduj klasę
zaladujKlaseBtn.addEventListener('click',()=>{
    const klasa = klasaSelect.value;
    if(!klasa) return alert("Wybierz klasę!");
    aktualnaKlasa = klasa;
    paneleDiv.style.display='block';
    panelContent.innerHTML="<p>Załaduj 'Realizacja zajęć', aby odblokować resztę paneli.</p>";
});

// Panele
panelBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
        const panel=btn.dataset.panel;
        if(panel==='uwagi'){ pokazPanelUwagi(); return; }

        panelContent.innerHTML=`<h2>${panel.charAt(0).toUpperCase()+panel.slice(1)} - ${aktualnaKlasa}</h2>`;
        if(panel==='realizacja') panelBtns.forEach(b=>{if(b.dataset.panel!=='realizacja') b.disabled=false;});
        loadPanelData(panel,true);
    });
});

// Panel Uwagi w stylu Vulcan
function pokazPanelUwagi() {
    panelContent.innerHTML = `
        <h2>Uwagi - ${aktualnaKlasa}</h2>
        <div id="formularzUwagi">
            <label for="uczenUwagi">Uczeń (ID):</label>
            <input type="text" id="uczenUwagi" placeholder="np. u1">

            <label for="kategoriaUwagi">Kategoria:</label>
            <select id="kategoriaUwagi">
                <option value="">-- Wybierz kategorię --</option>
                ${KATEGORIE_UWAG.map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>

            <label for="trescUwagi">Treść uwagi:</label>
            <textarea id="trescUwagi" placeholder="Wpisz treść uwagi..."></textarea>

            <button id="dodajUwageBtn">Dodaj uwagę</button>
        </div>
        <div id="listaUwag"><h3>Lista uwag:</h3></div>
    `;

    db.collection("klasy").doc(aktualnaKlasa).collection("uwagi").get()
      .then(snapshot => {
          const lista = document.getElementById("listaUwag");
          snapshot.docs.forEach(doc => {
              const d = doc.data();
              lista.innerHTML += `<p><strong>${doc.id}</strong> [${d.kategoria}] - ${d.tresc}</p>`;
          });
      });

    document.getElementById("dodajUwageBtn").addEventListener("click", () => {
        const uczen = document.getElementById("uczenUwagi").value.trim();
        const kategoria = document.getElementById("kategoriaUwagi").value;
        const tresc = document.getElementById("trescUwagi").value.trim();
        if (!uczen || !kategoria || !tresc) return alert("Wypełnij wszystkie pola!");

        db.collection("klasy").doc(aktualnaKlasa)
          .collection("uwagi").doc(uczen).set({ kategoria, tresc }, { merge: true })
          .then(() => {
              alert("Uwaga dodana!");
              pokazPanelUwagi(); 
          })
          .catch(err => alert("Błąd: " + err));
    });
}

// Funkcje ogólne paneli
function loadPanelData(panel, editable=false){
    db.collection("klasy").doc(aktualnaKlasa).collection(panel).get()
    .then(snapshot=>{
        if(snapshot.empty){panelContent.innerHTML+="<p>Brak danych.</p>"; return;}
        let html="<table><tr><th>Uczeń/Zadanie</th><th>Dane</th><th>Akcja</th></tr>";
        snapshot.docs.forEach(doc=>{
            html+=`<tr>
                <td>${doc.id}</td>
                <td>${editable? `<textarea id="data_${doc.id}">${JSON.stringify(doc.data())}</textarea>`: JSON.stringify(doc.data())}</td>
                <td>${editable? `<button onclick="saveDoc('${panel}','${doc.id}')">Zapisz</button>`:''}</td>
            </tr>`;
        });
        html+="</table>";
        panelContent.innerHTML+=html;
    }).catch(err=>console.error(err));
}

function saveDoc(panel, docId){
    const val=document.getElementById(`data_${docId}`).value;
    let data;
    try{data=JSON.parse(val);}catch(e){return alert("Niepoprawny format JSON!");}
    db.collection("klasy").doc(aktualnaKlasa).collection(panel).doc(docId).set(data)
    .then(()=>alert("Zapisano!"))
    .catch(err=>alert("Błąd: "+err));
}