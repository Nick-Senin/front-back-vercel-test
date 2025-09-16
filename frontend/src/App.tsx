import { useState, useEffect } from 'react'
import './App.css'

interface User {
  id: number
  name: string
  email: string
}

interface WeatherData {
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
  }
  meta: {
    source: string
  }
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchWeather = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/weather/omsk')
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error('Error fetching weather:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEcho = async () => {
    try {
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Hello from frontend!' }),
      })
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error testing echo:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="App">
      <header className="header">
        <h1>FastAPI + React App</h1>
        <p>Простое приложение с фронтендом и бэкендом на Vercel</p>
      </header>

      <main className="main">
        <section className="section">
          <h2>Пользователи</h2>
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Погода в Омске</h2>
          <button 
            onClick={fetchWeather} 
            disabled={loading}
            className="btn"
          >
            {loading ? 'Загрузка...' : 'Получить погоду'}
          </button>
          
          {weather && (
            <div className="weather-card">
              <h3>{weather.city}</h3>
              <div className="weather-info">
                <p><strong>Температура:</strong> {weather.current.temperature_2m}°C</p>
                <p><strong>Ощущается как:</strong> {weather.current.apparent_temperature}°C</p>
                <p><strong>Влажность:</strong> {weather.current.relative_humidity_2m}%</p>
                <p><strong>Скорость ветра:</strong> {weather.current.wind_speed_10m} м/с</p>
              </div>
            </div>
          )}
        </section>

        <section className="section">
          <h2>Echo тест</h2>
          <button onClick={testEcho} className="btn">
            Тестировать Echo
          </button>
          {message && (
            <pre className="message-box">{message}</pre>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
