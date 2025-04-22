// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

contract multiSigWallet {
    //Base contract
    address[] public owners;
    address public deployer;
    uint256 public noOfConfirmations;
    mapping(address => bool) public ownerMap;
    bool private ExecutionLock;


    constructor(address[] memory _owners, uint256 _noOfConfirmations) {
        require(
            _noOfConfirmations > 0,
            "Confirmation number should be greater than 0"
        );
        require(
            _noOfConfirmations < _owners.length,
            "Confirmation number should be less than no of owners"
        );
        deployer = msg.sender;
        for (uint256 index = 0; index < _owners.length; index++) {
            require(!ownerMap[_owners[index]], "All Owners must be unique");
            require(_owners[index] != address(0), "All Owners must be unique");
            ownerMap[_owners[index]] = true;
            owners.push(_owners[index]);
        }
        noOfConfirmations = _noOfConfirmations;
    }

    //Basic wallet functions
    event Deposit(address indexed sender, uint amount, uint balance);
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    fallback() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function getUserBalance(address user) public view returns (uint256) {
        return user.balance;
    }
    //depositing ether
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH to deposit");
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    //get the total ether in the contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }


    //Transactions
    //Initiate Transaction
    struct Transaction {
        address to;
        uint value;
        bool executed;
        uint numConfirmations;
    }

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public isConfirmed;

    modifier onlyOwner() {
        require(ownerMap[msg.sender], "Not owner");
        _;
    }

    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value
    );

    function submitTransaction(
        address _to,
        uint _value
    ) public onlyOwner {
        uint txIndex = transactions.length;
        transactions.push(
            Transaction({
            to: _to,
            value: _value,
            executed: false,
            numConfirmations: 0
        })
        );
        isConfirmed[txIndex][msg.sender] = true;

        emit SubmitTransaction(msg.sender, txIndex, _to, _value);
    }

    //Taking signature
    modifier txValidate(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    function confirmTransaction(uint _txIndex) public onlyOwner txValidate(_txIndex){
        Transaction storage transaction = transactions[_txIndex];

        require(!isConfirmed[_txIndex][msg.sender], "Transaction already confirmed");

        isConfirmed[_txIndex][msg.sender] = true;
        transaction.numConfirmations++;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    //Check signatures and Execute
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    //Reentracy protection
    modifier noReentrancy() {
        require(!ExecutionLock, "Reentrancy detected");
        ExecutionLock = true;
        _;
        ExecutionLock= false;
    }

    function executeTransaction(uint _txIndex)
    public
    onlyOwner
    txValidate(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= noOfConfirmations,
            "Cannot execute tx: not enough confirmations"
        );

        transaction.executed = true;
        //send to recipient
        (bool success, ) = payable(transaction.to).call{value: transaction.value}("");
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txValidate(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "Transaction not confirmed");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }
    

    function getTransaction(uint _txIndex)
        public
        view
        returns (
            address to,
            uint value,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.executed,
            transaction.numConfirmations
        );
    }

function getOwners() public view returns (address[] memory) {
    return owners;
}

function getTransactionCount() public view returns (uint) {
    return transactions.length;
}

}
