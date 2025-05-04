// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenantManagement {
    struct TenantInfo {
        string tenantId;
        string role;           // admin 或 tenant
        string tenantType;     // type1 或 type2
        string type1Detail;    // Level1 / Level2 / Network Admin（如果type1）或空（如果type2）
        bool exists;           // 是否已注册
    }

    mapping(address => TenantInfo) public tenants;

    // 注册租户
    function registerTenant(
        string memory _tenantId,
        string memory _role,
        string memory _tenantType,
        string memory _type1Detail
    ) public {
        require(!tenants[msg.sender].exists, "Tenant already registered");

        tenants[msg.sender] = TenantInfo({
            tenantId: _tenantId,
            role: _role,
            tenantType: _tenantType,
            type1Detail: _type1Detail,
            exists: true
        });
    }

    // 查询租户信息
    function getTenantInfo(address _tenant) public view returns (
        string memory tenantId,
        string memory role,
        string memory tenantType,
        string memory type1Detail
    ) {
        require(tenants[_tenant].exists, "Tenant not registered");

        TenantInfo memory info = tenants[_tenant];
        return (info.tenantId, info.role, info.tenantType, info.type1Detail);
    }

    // 检查地址是不是注册了租户
    function isTenant(address _tenant) public view returns (bool) {
        return tenants[_tenant].exists;
    }
}
