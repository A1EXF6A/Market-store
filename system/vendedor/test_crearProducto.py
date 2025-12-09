# test_crear_producto.py
import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestCrearProducto:

    def setup_method(self, method):
        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1280, 900)
        self.wait = WebDriverWait(self.driver, 20)

    def teardown_method(self, method):
        self.driver.quit()

    def login(self):
        driver = self.driver
        wait = self.wait

        driver.get("http://localhost:5173/login")

        # Email
        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(
            "alexflakito15@gmail.com"
        )

        # Password
        wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys(
            "14052003@leX"
        )

        # Botón iniciar sesión
        wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        )).click()

        wait.until(EC.url_contains("/dashboard"))

    def test_crear_producto(self):
        driver = self.driver
        wait = self.wait
        # 1. Login
        self.login()
        # 2. Ir a Crear Producto
        driver.get("http://localhost:5173/products/create")
        wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(text(), 'Crear Producto')]")
        ))
        print("✅ Página de crear producto cargada")

        # Campos de texto
        wait.until(EC.visibility_of_element_located((By.ID, "name"))).send_keys("Tablet de prueba")
        wait.until(EC.visibility_of_element_located((By.ID, "description"))).send_keys("Tablet nueva agregada desde Selenium")

        # -----------------------------------------------------
        # 🔥 SELECCIÓN DE CATEGORÍA (SHADCN / RADIX SELECT)
        # -----------------------------------------------------

        print("🔽 Abriendo menú de categorías...")

        # 1. CLICK en el botón "Selecciona una categoría"
        category_trigger = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//label[@for='category']/following-sibling::button")
        ))
        category_trigger.click()

        print("📂 Menú abierto, buscando opción 'Hogar'...")

        # 2. HACER CLICK en la opción visible
        hogar_option = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//div[@role='option' and text()='Hogar' or .='Hogar']")
        ))
        hogar_option.click()

        print("✅ Categoría 'Hogar' seleccionada correctamente")

        # Precio
        wait.until(EC.visibility_of_element_located((By.ID, "price"))).send_keys("120")

        # Ubicación
        wait.until(EC.visibility_of_element_located((By.ID, "location"))).send_keys("Quito")

        # Botón Crear Producto
        publish_btn = wait.until(
          EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        )

        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", publish_btn)
        publish_btn.click()


        # Validar redirección
        
        wait.until(EC.url_contains("/my-products"))

        print("🎉 PRODUCTO CREADO EXITOSAMENTE")
