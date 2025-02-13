// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TenantManagement {
    struct Tenant {
        address tenantAddress;
        string companyName;
        bool exists;
    }

    mapping(address => Tenant) public tenants;

    event TenantRegistered(address indexed tenantAddress, string companyName);

    function registerTenant(string memory _companyName) public {
        require(!tenants[msg.sender].exists, "Tenant already registered");

        tenants[msg.sender] = Tenant(msg.sender, _companyName, true);
        emit TenantRegistered(msg.sender, _companyName);
    }

    function isTenant(address _tenant) public view returns (bool) {
        return tenants[_tenant].exists;
    }
}
