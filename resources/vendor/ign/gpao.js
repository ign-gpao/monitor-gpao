const apiUrl = document.currentScript.getAttribute('api-url');
const monitorUrl = "http://"+window.location.href.split('/')[2];

//----------------------------- PROJETS ------------------------------

//------ Groupe de fonctions qui permettent d'importer un projet -----

function sendProject(json){
  // fetch(`${apiUrl}/api/project`, {
  fetch(`${monitorUrl}/projects/sendProject`, {
    method: "PUT",
    body: json,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}

// Fonction qui importe un projet via un fichier json
function jsonChanged(file) {
  var reader = new FileReader();
  reader.addEventListener('load', function(e) {
    // contents of file in variable     
    var json = e.target.result;
    sendProject(json);
  });
  // read as text file
  reader.readAsText(file);  
}

function createJson(projectName, commandLines, tags) {
  // contents of file in variable     
  const P = { projects:[{name: projectName, jobs:[]}]};
  commandLines.forEach((line, index) => {
    if (line.length>0) {
      let job;
      if (tags === "") {
        job = {name: `job ${index}`, command: line};
      } else {
        job = {name: `job ${index}`, command: line, tags: tags.split(',')};
      }
      P.projects[0].jobs.push(job);
    }
  });
  var json = JSON.stringify(P);
  return json;
}

// Fonction qui importe un projet via un fichier txt
function txtChanged(file, tags) {
  var reader = new FileReader();
  reader.addEventListener('load', function(e) {
    var text = e.target.result.split(/\r\n|\n/);
    var json = createJson(file.name, text, tags);
    sendProject(json);
  });
  // read as text file
  reader.readAsText(file);
}

// Fonction qui importe un projet via des lignes de commande à saisir directement dans l'interface
function textareaSubmited(projectName, textarea, tags){
  textarea = textarea.split(/\r\n|\n/);
  var json = createJson(projectName, textarea, tags);
  sendProject(json);
}

//--------------------------------------------------------------------

// Fonction qui récupère la liste des projets filtrées (en json)
function getFilteredProjects(){
  var table = $('#dataTable').DataTable();
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);

  rowsFiltered.each( function (row) {
    jsonIds["ids"].push(row.id);
  });

  return jsonIds
}

function deleteProject(jsonIds) {
  // fetch(`${apiUrl}/api/projects/delete`, {
  fetch(`${monitorUrl}/projects/deleteProjects`, {
    method: 'DELETE',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(() => {
    location.reload();
  });
}

// Fonction permettant de supprimer un projet
function deleteOneProject(id, name) {
  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);
  jsonIds["ids"].push(id);

  if (window.confirm(`Supprimer le projet : ${name} ?`)) {
    deleteProject(jsonIds);
  }
}

// Fonction permettant de supprimer tous les projets filtrés
function deleteFilteredProjects () {
  var jsonIds = getFilteredProjects()
  if (window.confirm(`Supprimer tous les projets filtrés ?`)) {
    deleteProject(jsonIds); 
  }
}

// Fonction permettant de changer la priorité d'un projet
function setPriority(id, priority) {
  // on fait une requete sur l'API
  fetch(`${monitorUrl}/projects/setPriority?id=${id}&priority=${priority}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
}


//------------------------------- JOBS -------------------------------

//Fonction qui permet de réinitialiser une liste de jobs (en json)
function reinitJobs(jsonIds){
  fetch(`${monitorUrl}/jobs/reinit`, {
    method: 'POST',
    body: JSON.stringify(jsonIds),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}

//Fonction qui réinitialise tous les jobs filtrés avec le statut failed
function reinitFilteredJobs(table){
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var ids = '{"ids":[]}';
  var jsonIds = JSON.parse(ids);

  rowsFiltered.each( function (row) {
    if ( row.job_status === 'failed' ) {
      jsonIds["ids"].push(row.job_id)
    }
  });
  
  reinitJobs(jsonIds);
}


//-------------------------- SESSIONS/HOSTS --------------------------

// Fonction qui récupère la liste des machines filtrées (en json)
function getFilteredHosts(){
  var table = $('#dataTable').DataTable();
  var rowsFiltered = table.rows({
    search: 'applied',     // 'none',    'applied', 'removed'
  }).data();

  var hosts = '{"hosts":[]}';
  var jsonHosts = JSON.parse(hosts);
  
  rowsFiltered.each( function (row) {
    jsonHosts["hosts"].push(row.host);
  });

  return jsonHosts
}

// Fonction modifiant le nombre de threads actifs sur une liste de machine
function setNbActiveSessions(jsonHosts, value) {
  if (!isNaN(value)) {
    console.log(monitorUrl);
    // fetch(`${apiUrl}/api/node/setNbActive?value=${value}`, {
    fetch(`${monitorUrl}/sessions/setNbActive?value=${value}`, {
      method: 'POST',
      body: JSON.stringify(jsonHosts),
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(() => {
      location.reload();
    });
  }
}

//Fonction qui supprime toutes les sessions inutiles
function deleteUnusedSession(){
  fetch(`${monitorUrl}/sessions/cleanUnused`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(() => {
    location.reload();
  });
}


//------------------------------ AUTRES ------------------------------

// Fonction permettant de vider la base GPAO
function cleanDatabase () {
  if (window.confirm(`Souhaitez vous vider la base ?`)) {
    fetch(`${monitorUrl}/maintenance/cleanDatabase`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(() => {
      location.reload();
    });
  }
}

// Fonction qui permet de calculer le pourcentage entre une valeur et le total
function percent(num, per) {
  if(per==0)
    return 0;
  return (Math.round((num / per) * 100));
}