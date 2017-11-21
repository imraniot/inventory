// Import the page's CSS. Webpack will know what to do with it. 
import "../stylesheets/app.css";
import {
  default as Web3
} from 'web3';
import {
  default as contract
} from 'truffle-contract'
import inventory_artifacts from '../../build/contracts/Inventory.json'

var Inventory = contract(inventory_artifacts);
var priceList = [];
var nameList = ["500MB", "400MB", "300MB", "200MB", "100MB","50MB", "30MB", "20MB", "10MB", "5MB"];
var unitPriceList = [5, 4, 3, 2, 1, 0.5, 0.3, 0.2, 0.1, 0.05];

$(document).ready(function () {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source like Metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }
  Inventory.setProvider(web3.currentProvider);
  getAllProductInfo();
});

function getAllProductInfo() {
  Inventory.deployed().then(function (inventoryInstance) {
    inventoryInstance.getIdList.call().then(function (proArray) {

      for (let i = 0; i < proArray.length; i++) {
        inventoryInstance.getProductInfo.call(proArray[i]).then(function (v) {
          var proId = web3.toDecimal(proArray[i]);
          var ether = web3.fromWei(v[1], 'ether');
          //console.log('getProductInfo -------- : ', proId, v[0], v[1]);
          $("#products_rows").append("<tr><td>" + proId + "</td><td>" + nameList[i] + "</td><td>" + unitPriceList[i] + " ETH" + "</td><td>" + v[0] + "</td></tr>");
          priceList[proId] = unitPriceList[i];
        });
      }
    });
  });
}
window.sellTheProduct = function () {

  var proId = $("#product_id").val();
  var proQuantity = $("#product_quantity").val();
  var buyerAddress = $("#address_").val();
  var buyerPassword = $("#password_").val();
  var timeOut = $("#timeOut_").val();
  console.log('sellTheProduct --------:', proId, proQuantity, buyerAddress, buyerPassword, timeOut);

  if (timeOut == '') {
    timeOut = '0';
  } else if (!$.isNumeric(parseInt(timeOut))) {
    $("#msgUnlock").html("Please input numeric time out value.");
    $("#msgUnlock").css('color', '#FF0000');
    return;
  }

  if (proId != "" && proQuantity != "" && buyerAddress != "" && buyerPassword != "") {

    if (web3.isAddress(buyerAddress)) {
      console.log('sellTheProduct -------- 222: ');
      var proPrice = priceList[proId];
     
      if (proPrice != 0) {
        proPrice = proPrice*1000000000000000000;
        var proTotalPrice = proPrice * parseInt(proQuantity);
        web3.eth.getBalance(buyerAddress, function (error, result) {
          console.log('sellTheProduct -------- 333: ', error, "result: ", result);
          if (!error) {
            if (result > proTotalPrice) {
              var timeOutInt = parseInt(timeOut);
              console.log('sellTheProduct -------- 444: ', buyerAddress, buyerPassword, timeOutInt, proTotalPrice);
              web3.personal.unlockAccount(buyerAddress, buyerPassword, timeOutInt, function (error, result) {
                console.log('unlockAccount -------- 5555 error : ', error, 'result: ', result);
                if (result) {

                  $("#msgBuy").html("Product purchase order have been added to blockchain. Please wait...");
                  $("#msgBuy").css('color', '#ff9900');
                  $("#product_id").val("");
                  $("#product_quantity").val("");
                  $("#address_").val("");
                  $("#password_").val("");
                  $("#timeOut_").val("");

                  Inventory.deployed().then(function (inventoryInstance) {
                    inventoryInstance.sellProduct(proId, parseInt(proQuantity), {
                        gas: 140000,
                        from: "0xa4374150c794d290a61d656f57ebf13773dbd0d1"
                      })
                      .then(function (result) {
                        console.log('sellProduct -------- : result', result);
                        if (result) {
                          web3.eth.sendTransaction({
                            from: buyerAddress,
                            to: "0xa4374150c794d290a61d656f57ebf13773dbd0d1",
                            value: proTotalPrice,
                          }, function (error, result) {
                            console.log('sendTransaction -------- : result', result, error);
                            $("#msgBuy").html("Product purchase completed. Please Refresh.");
                            $("#msgBuy").css('color', '#009933');
                          });
                        }
                      });
                  });
                }else {
                  $("#msgBuy").html("Account can't unlock.");
                  $("#msgBuy").css('color', '#FF0000');
                }
              });
            } else {
              $("#msgBuy").html("You have not sufficient balance.");
              $("#msgBuy").css('color', '#FF0000');
            }
          }
        });
      } else {
        $("#msgBuy").html("Please input a valid Product ID.");
        $("#msgBuy").css('color', '#FF0000');
      }

    } else {
      $("#msgBuy").html("Please input a valid address.");
      $("#msgBuy").css('color', '#FF0000');
    }

  } else {
    $("#msgBuy").html("Product ID or quantity and Account address or password can't be blank.");
    $("#msgBuy").css('color', '#FF0000');
  }
}
window.getAccountInfo = function() {
  var acAddress = $("#account_address").val();
  console.log("getAccountInfo : " + acAddress);
  //var info = myAddress;
  var balance = web3.eth.getBalance(acAddress);
  var ether = web3.fromWei(balance, 'ether');
  var gasPrice = 0;

  web3.eth.getGasPrice(function (error, result) {
    if (result) {
        $("#account_row").append("<tr><th >" + "Address" + "</th><td>" + acAddress);
        $("#account_row").append("<tr><th>" + "Balance (ETH)" + "</th><td>" + ether + "</td></tr>");
        $("#account_row").append("<tr><th>" + "GAS price" + "</th><td>" + result + "</td></tr>");
    }
  });
}
// window.addEmployees = function() {
//   let empName = $("#employee_name").val();
//   let empAge = $("#employee_age").val();
//   listCount++;
//   let empId = listCount;
//   $("#msgAdd").html("The add request has been submitted. The list will update after updated the blockchain. Please wait...")
//   $("#employee_name").val("");
//   $("#employee_age").val("");

//   SaveAndGetInfo.deployed().then(function(contractInstance) {
//     contractInstance.saveInfo(empId, empName, empAge, {gas: 140000, from: myAddress})
//     .then(function(result) {
//       console.log('--------- addEmployees 2: saved done');
//       contractInstance.getSavedInfo.call(empId).then(function(v){
//         $("#candidate-rows").append("<tr><td>" + empId + "</td><td>" + v[0] + "</td><td>" + v[1] + "</td><td>" + "Active" + "</td><td>" + v[2] + "</td></tr>");
//         $("#msgAdd").html("");
//         indexList[empId] = empId;
//       });
//     });
//   });
// }
// //$("#elementId :selected").text(); // The text content of the selected option
// //$("#elementId").val();
// window.searchEmployee = function() {
//   SaveAndGetInfo.deployed().then(function(contractInstance) {
//     let empID = $("#employee_id").val();
//     $("#employee_id").val('');
//     contractInstance.getSavedInfo.call(empID).then(function(v){
//       //console.log('candidate -------- : ',v[3]);
//       $("#employee_updated_id").val(empID);
//       $("#employee_updated_name").val(v[0]);
//       $("#employee_updated_age").val(v[1]);
//       $("select#emp_status_menu").prop('selectedIndex', parseInt(v[3])); 
//     });
//   });
// }

// window.updateEmployee = function() {
//   let empId = $("#employee_updated_id").val();
//   let empName = $("#employee_updated_name").val();
//   let empAge = $("#employee_updated_age").val();
//   let empStatus = parseInt($("#emp_status_menu").val()); 
//   console.log('empStatus -------- : ',empId, empStatus);

//   if(empId != 0 && empId != ""){
//   $("#msgUpdate").html("The update request has been submitted. The list will update after updated the blockchain. Please wait...");
//   $("#msgUpdate").css('color', '#000000');
//   $("#employee_updated_id").val("");
//   $("#employee_updated_name").val("");
//   $("#employee_updated_age").val("");
//   $("select#emp_status_menu").prop('selectedIndex', 0); 

//   SaveAndGetInfo.deployed().then(function(contractInstance) {
//     contractInstance.updateInfo(empId, empName, empAge, empStatus, {gas: 140000, from: '0xa4374150c794d290a61d656f57ebf13773dbd0d1'})
//     .then(function(result) {
//       console.log('--------- updateEmployee: update done');
//       $("#msgUpdate").html("");
//       var myTable = document.getElementById('all_emp_table');
//       myTable.rows[indexList[empId]].cells[1].innerHTML = empName;
//       myTable.rows[indexList[empId]].cells[2].innerHTML = empAge;
//       myTable.rows[indexList[empId]].cells[3].innerHTML = getEmployeeStatus(empStatus);
//     });
//   });
//   }else{
//     $("#msgUpdate").html("ID can't be null.");
//     $("#msgUpdate").css('color', '#FF0000');
//   }
// }

// function getAccountInfo()
// {
//   console.log("getAccountInfo : " + myAddress);
//   //var info = myAddress;
//   var balance = web3.eth.getBalance(myAddress);
//   var ether = web3.fromWei(balance, 'ether');
//   var gasPrice = 0;

//   web3.eth.getGasPrice(function (error, result) {
//     if (error) {

//         $("#account_row").append("<tr><th >" + "Address" + "</th><td>" + myAddress + "</td></tr>");
//         $("#account_row").append("<tr><th>" + "Balance (ETH)" + "</th><td>" + ether + "</td></tr>");
//         $("#account_row").append("<tr><th>" + "GAS price" + "</th><td>" + gasPrice + "</td></tr>");
//     }
//     else {

//         $("#account_row").append("<tr><th >" + "Address" + "</th><td>" + myAddress + "</td></tr>");
//         $("#account_row").append("<tr><th>" + "Balance (ETH)" + "</th><td>" + ether + "</td></tr>");
//         $("#account_row").append("<tr><th>" + "GAS price (Wei)" + "</th><td>" + result + "</td></tr>");
//     }
//   });
// }

// window.unlockAccount = function(){

//   let acId = $("#account_address").val();
//   let acPass = $("#account_password").val();
//   var acTimeOut = $("#account_timeOut").val();
//   if(acTimeOut == ''){
//     acTimeOut = '0';
//   }
//   var acTimeOutDigit = parseInt(acTimeOut);
//   console.log('unlockAccount : ', acId, acPass, acTimeOut, acTimeOutDigit);

//   if (acId != "" && acPass != ""){

//     if(web3.isAddress(acId)){

//       if(!$.isNumeric(acTimeOutDigit))
//       {
//         $("#msgUnlock").html("Please input numeric time out value.");
//         $("#msgUnlock").css('color', '#FF0000');
//         return;
//       }
//       $("#msgUnlock").html("The Unlock request has been submitted. Please wait...");
//       $("#msgUnlock").css('color', '#000000');
//       $("#account_address").val("");
//       $("#account_password").val("");
//       $("#account_timeOut").val("");

//   var acTimeOutDigit = parseInt(acTimeOut);
//       web3.personal.unlockAccount(acId, acPass, acTimeOutDigit, function(error, result){
//         if(error == null){
//           $("#msgUnlock").html("The account has beed unlocked.");
//           $("#msgUnlock").css('color', '#000000');
//           setCookie(myAddress_key, acId);
//           myAddress = acId;
//           console.log('unlockAccount page: ',page);
//           if(page == 'Employee List'){
//             dialog.dialog( "close" );
//             getAllEmpInfo();
//           }else{
//             getAccountInfo();
//           }
//         }else{
//           $("#msgUnlock").html(error);
//           $("#msgUnlock").css('color', '#FF0000');
//         }
//       }); 
//     }else{
//       $("#msgUnlock").html("Please input a valid address.");
//       $("#msgUnlock").css('color', '#FF0000');
//     }
//   }else{
//     $("#msgUnlock").html("Account address or password can't be blank");
//     $("#msgUnlock").css('color', '#FF0000');
//   }
// }

// function setCookie(key, value)
//  {
//   sessionStorage.setItem(key, value);
// }

// function getCookie(key) 
// {
//   return sessionStorage.getItem(key);
// }

// function getEmployeeStatus(statusID){
//   var id = parseInt(statusID);
//   var status;
//   switch (id) {
//     case 0:
//       status = "Active";
//       break;
//     case 1:
//       status = "Suspended";
//       break; 
//     case 2:
//       status = "Inactive";
//       break;
//     default: 
//       status = "Status Unavailable";
//  }
//   return status;
// }