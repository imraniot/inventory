pragma solidity ^0.4.11;

contract Inventory {

    address public owner;
    struct ProductInfoObj {    
    uint productAvailableNumber;
    uint productUnitPrice; 
    }
    mapping (uint => ProductInfoObj) public allInfoList;
    uint[] public idList;

    function Inventory() public {
        owner = msg.sender;
        for (uint proId = 101; proId < 111; proId++) {
           allInfoList[proId] = ProductInfoObj(10, 1000000000000000000); 
           idList.push(proId);
        }
    }

  function sellProduct(uint proId, uint proQuantity) public {

        uint index = indexOfProduct(proId);
        if (index == uint(-1)) {
           throw;
        } else {
            uint quantity = allInfoList[proId].productAvailableNumber;
           if (quantity == 0 || quantity < proQuantity) {
            throw;
           } else {
              quantity -= proQuantity;
              allInfoList[proId].productAvailableNumber = quantity;
           }
        } 
    }

    function sendBalance() public {
        address x = 0x123;
        address myAddress = this;
        if (x.balance < 10 && myAddress.balance >= 10) { 
            x.transfer(10);
        } 
    }

    // function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {

    //         if (_from.balance < _value) {
    //             throw;                                              // Check if the sender has enough
    //         }                 
    //         if (_to.balance + _value < _to.balance) {
    //             throw;                                              // Check for overflows
    //         }  
    //         if (_value > _from.allowance[msg.sender]) {
    //             throw;                                              // Check allowance
    //         }   
    //         balanceOf[_from] -= _value;                             // Subtract from the sender
    //         balanceOf[_to] += _value;                               // Add the same to the recipient
    //         allowance[_from][msg.sender] -= _value;
    //         Transfer(_from, _to, _value);
    //         return true;
    //     }

    function getProductInfo(uint proId) public constant returns (uint, uint) {
        return (allInfoList[proId].productAvailableNumber, allInfoList[proId].productUnitPrice);
    }
    // function send(address receiver, uint amount) public {

    //     if (msg.sender.balances < amount) 
    //     return;
        
    //     [msg.sender].balances -= amount;
    //     [owner].balances += amount;
    //     [msg.sender].transfer(amount);
    //     return true;//Sent(msg.sender, owner, amount);
    // }
    function getIdList() public constant returns (uint[]) {
    return idList;
    }

    function indexOfProduct(uint proId) private constant returns (uint) {
    for (uint i = 0; i < idList.length; i++) {
      if (idList[i] == proId) {
        return i;
      }
    }
    return uint(-1);
    }

    function testIt() public returns (string) {
        
        return "This is test inventory app.";
    }
} 