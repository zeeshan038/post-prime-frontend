import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Button, Dropdown, Avatar, message } from 'antd'
import { useLogout } from '../hooks/auth'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      // Clear local storage
      localStorage.clear()
      // Redirect to login page
      navigate('/login')
      message.success('Logged out successfully')
    } catch (error) {
      console.log(error)
    }
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ height: '100vh', background: '#FFF9F2' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {collapsed ? 'PP' : 'PrimePost'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(String(key))}
          items={[
            { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: '/posts', icon: <TeamOutlined />, label: 'Posts' },
            { key: '/analytics', icon: <UserOutlined />, label: 'Analytics' }
          ]}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#FFF9F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 64, height: 64, color: '#16A34A' }}
            />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#14532D' }}>
              PrimePost
            </div>
          </div>
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              size="large"
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: '#16A34A', 
                cursor: 'pointer',
                marginRight: 8
              }}
            />
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px', padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
