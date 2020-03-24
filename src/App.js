import React from 'react';
import fs from 'fs';


class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
        navbar:true,
        path : window.location.pathname,
        datasource: [],
        json_files:null,
        dataList: [],
        file_names: []
    }
}




convertToNew = (timing) => {
  let new_arr = []
  let keys = Object.keys(timing)
  for(let i of keys){
    new_arr.push(timing[i])
  }



  const outData = [];
  let timeZone;
  for (const obj of new_arr) {
    timeZone = { zone: [] };
    for (const arr of Object.values(obj)) {
      timeZone.zone.push({ timeInfo: arr});
    }
    outData.push(timeZone);
  }
  
  return outData
}


convertToNewJson = (old_json) => {
  old_json = JSON.stringify(old_json)
  old_json = JSON.parse(old_json)
  
  for(let i=0; i< old_json.length; i++){
    delete Object.assign(old_json[i], {["formFactor"]: old_json[i]["Form Factor"] })["Form Factor"];
    delete Object.assign(old_json[i], {["badgeNumber"]: old_json[i]["Badge Number"] })["Badge Number"];
    delete Object.assign(old_json[i], {["name"]: old_json[i]["Name"] })["Name"];
    delete Object.assign(old_json[i], {["dateTime"]: old_json[i]["Date and Time"] })["Date and Time"];
    delete Object.assign(old_json[i], {["model"]: old_json[i]["Model Number"] })["Model Number"];
    delete Object.assign(old_json[i], {["mode"]: old_json[i]["Mode"] })["Mode"];
    delete Object.assign(old_json[i], {["repetitions"]: old_json[i]["Repetition"] })["Repetition"];
    delete Object.assign(old_json[i], {["timing"]: old_json[i]["Timing"] })["Timing"];

    if(old_json[i]["formFactor"] === "SFF"){
      old_json[i]["formFactor"] = "SSF"
    }

    old_json[i]["timing"] = this.convertToNew(old_json[i]["timing"])
    old_json[i]["dateTime"] = this.dateFormatter(old_json[i]["dateTime"])
    old_json[i]["mode"] = old_json[i]["mode"].replace(" mode", "")
    old_json[i]["mode"] = old_json[i]["mode"].replace(" Mode", "")

    for(let o of old_json[i]["timing"]){
      delete Object.assign(o, {["zoneInfo"]: o["zone"] })["zone"];
    }

    old_json[i]["hit_drop"] = this.handleHitDrop(old_json[i]["Handling"])
  }

  return old_json
}


dateFormatter = (date) => {
  let d_array = []
  date = date.split(",")
  date = date.slice(0, 2)
  date = date.toString()
  date = date.replace(",", "")
  date = date.split(" ")

  date[0] = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(date[0]) / 3 + 1 

  let month = date[0]
  let year = date[2]
  let dat = date[1]
  month = month.toString()
  if(month.length === 1){
    month = "0"+month
  }
  d_array = [year, month, dat]
  d_array = d_array.toString()
  d_array = d_array.replace(",", ".")
  d_array = d_array.replace(",", ".")
  d_array = d_array+"-21.10.03"
  return d_array
}

handleHitDrop  = (arr) => {
  arr = [arr]
    let data = arr.map(obj => Object.fromEntries(
      Object.entries(obj).map(([z, {Drop, Hit}]) => [z, Drop[0] + Hit[0]])
  ));
  data = Object.values(data[0]).reduce((a, b) => a + b, 0) 
  return data
}

  getfolder = (e) => {
    let files = e.target.files;
    this.readFilesNew(files);
  };


readFilesNew = (files) => {
  
  let file_names = []
  for(let i of files){
    file_names.push(i["name"])
  }

  this.setState({
    file_names: file_names
  })

  let result = [];
  let count = 0;
  for (let i of files) {
      count++;
      const reader = new FileReader();
      reader.onload = function (e) {
          try{
            const obj = eval(e.target.result)
            result.push(obj);
          }catch(err) {
            const obj = JSON.parse(e.target.result)
            result.push(obj);
          }
      };
      reader.readAsText(i);
      if (count === files.length - 1) {
          this.setState(({
              dataList: result,
              json_files: files
          }), () => setTimeout(() => {
              this.showDataSource()
          }, 1000));
      }
  }
};



showDataSource = () => {
  const {dataList} = this.state;
  let old_jsons = []
  let new_jsons = []
  for(let i of dataList){
    if(Array.isArray(i)){
      old_jsons.push(this.convertToNewJson(eval(i)))
    }
  }
  for(let i of dataList){
    if(!Array.isArray(i)){
      new_jsons.push(i)
    }
  }

  for(let i of old_jsons){
    new_jsons.push({
      "sessions": i
    })
  }

  for (let i of new_jsons){
    for(let j of i["sessions"]){
      if(j["formFactor"] === "SFF"){
        j["formFactor"] = "SSF"
      }
      for(let k of j["timing"]){
        for(let l of k["zoneInfo"]){
          if(l["timeInfo"].length && !l["timeInfo"][0]){
            l["timeInfo"].splice(0, 1)
          }
        }
      }
    }
  }

  let file_names = this.state.file_names;
  for(let i=0;i<new_jsons.length; i++){
    let a = document.createElement('a');
    a.href = "data:application/octet-stream,"+encodeURIComponent(JSON.stringify(new_jsons[i]));
    a.download = "new_"+file_names[i]
    a.click();
  }


};




  makeTextFile = (text) => {
    let textFile = null
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

  render(){
    return (
      <div style={{ padding:'1cm' }}>
        <label className="nav-text" style={{color:'#fff', marginTop:'10px', cursor:'pointer', background:'#0099ff', padding:'10px'  }}>Data source
          <input type="file" style={{ display:'none' }} onChange={this.getfolder} directory="" webkitdirectory="" multiple accept=".json"/>
        </label>
      </div>
    );
  }
}

export default App;
