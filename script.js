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

// Po zalogowaniu
function loadTeacherData(uid){
    db.collection("nauczyciele").doc(uid).get().then(doc=>{
        if(!doc.exists) return alert("Brak danych nauczyciela!");
        const data = doc.data();
        userName.textContent = data.name;
        loginDiv.style.display='none';
        dziennikDiv.style.display='block';
        klasaSelect.innerHTML='<option value="">-- Wybierz --</option>';
        data.klasy.forEach(k=>{
            const opt=document.createElement('option');
            opt.value=k; opt.textContent=k;
            klasaSelect.appendChild(opt);
        });
    });
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
        if(panel==='realizacja'){
            panelContent.innerHTML=`<h2>Realizacja zajęć - ${aktualnaKlasa}</h2>`;
            panelBtns.forEach(b=>{if(b.dataset.panel!=='realizacja') b.disabled=false;});
            loadPanelData(panel,true);
        }else{
            panelContent.innerHTML=`<h2>${panel.charAt(0).toUpperCase()+panel.slice(1)} - ${aktualnaKlasa}</h2>`;
            loadPanelData(panel,true);
        }
    });
});

// Ładowanie paneli i edycja
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

// Zapis dokumentu
function saveDoc(panel, docId){
    const val=document.getElementById(`data_${docId}`).value;
    let data;
    try{data=JSON.parse(val);}catch(e){return alert("Niepoprawny format JSON!");}
    db.collection("klasy").doc(aktualnaKlasa).collection(panel).doc(docId).set(data)
    .then(()=>alert("Zapisano!"))
    .catch(err=>alert("Błąd: "+err));
}
