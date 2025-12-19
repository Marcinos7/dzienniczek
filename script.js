const firebaseConfig = {
    apiKey: "TU_WSTAW_SWÓJ_API_KEY",
    authDomain: "dzienniczek-a488a.firebaseapp.com",
    projectId: "dzienniczek-a488a",
    storageBucket: "dzienniczek-a488a.firebasestorage.app",
    messagingSenderId: "194419034610",
    appId: "1:194419034610:web:132c6597ce9b750896436b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM
const loginDiv = document.getElementById('loginDiv');
const dashboardDiv = document.getElementById('dashboardDiv');
const dziennikDiv = document.getElementById('dziennikDiv');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const userName = document.getElementById('userName');
const userNameDziennik = document.getElementById('userNameDziennik');
const klasaSelect = document.getElementById('klasaSelect');
const zaladujKlaseBtn = document.getElementById('zaladujKlase');
const paneleDiv = document.getElementById('panele');
const panelContent = document.getElementById('panelContent');
const panelBtns = document.querySelectorAll('.panelBtn');
const goToDziennik = document.getElementById('goToDziennik');

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
logoutBtn.addEventListener('click', ()=> auth.signOut().then(()=>location.reload()));

// Po zalogowaniu
function loadTeacherData(uid){
    db.collection("nauczyciele").doc(uid).get().then(doc=>{
        if(!doc.exists) return alert("Brak danych nauczyciela!");
        const data = doc.data();
        const imie = data.imie || "Nauczyciel";
        userName.textContent = imie;
        userNameDziennik.textContent = imie;

        loginDiv.style.display = 'none';
        dashboardDiv.style.display = 'block';

        // Tutaj wczytanie danych do kart
        loadDashboardData();

        // Ładowanie klas do dziennika
        klasaSelect.innerHTML = '<option value="">-- Wybierz --</option>';
        db.collection("klasy").get().then(snapshot=>{
            snapshot.forEach(doc=>{
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().nazwa || doc.id;
                klasaSelect.appendChild(opt);
            });
        });
    });
}

function loadDashboardData(){
    const dzis = new Date();
    document.getElementById('imieniny').textContent = "Imieniny: Jan, Anna"; // tu możesz dynamicznie
    document.getElementById('najblizszeTesty').textContent = "Najbliższe testy: Matematyka 22.12, Fizyka 23.12";
    document.getElementById('informacjeDyrekcja').textContent = "Informacje od dyrekcji: Zebranie 20.12";
    document.getElementById('dniWolne').textContent = "Dni wolne: 24-25.12";
    document.getElementById('zastepstwa').textContent = "Zastępstwa: 7B - chemia zamiast biologii";
}

// Przejście do dziennika
goToDziennik.addEventListener('click', ()=>{
    dashboardDiv.style.display = 'none';
    dziennikDiv.style.display = 'block';
});

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
