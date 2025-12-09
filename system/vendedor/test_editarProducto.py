# test_editarProducto.py
import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class TestEditarProducto:

    def setup_method(self, method):
        self.driver = webdriver.Firefox()
        self.driver.set_window_size(1280, 900)
        self.wait = WebDriverWait(self.driver, 20)

    def teardown_method(self, method):
        self.driver.quit()

    # ------------------------------------------------------
    # LOGIN
    # ------------------------------------------------------
    def login(self):
        driver = self.driver
        wait = self.wait

        driver.get("http://localhost:5173/login")

        wait.until(EC.visibility_of_element_located((By.ID, "email"))).send_keys(
            "alexflakito15@gmail.com"
        )
        wait.until(EC.visibility_of_element_located((By.ID, "password"))).send_keys(
            "14052003@leX"
        )

        wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        ).click()

        wait.until(EC.url_contains("/dashboard"))


    # ------------------------------------------------------
    # TEST EDITAR PRODUCTO
    # ------------------------------------------------------
    def test_editarProducto(self):
        driver = self.driver
        wait = self.wait
        # 1. LOGIN
        self.login()
        # 2. Ir a Mis Productos
        driver.get("http://localhost:5173/my-products")
        wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(text(), 'Mis Productos')]")
        ))
        # ------------------------------------------------------
        # 3. ABRIR SELECT DE ESTADO (Radix)
        # ------------------------------------------------------
        estado_trigger = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[data-slot='select-trigger']")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", estado_trigger)
        estado_trigger.click()

        # Seleccionar una opción (Publicado)
        opcion_publicado = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//div[@role='option'][contains(., 'Activo')]")
        ))
        opcion_publicado.click()

        # Click en botones "Buscar" y "Limpiar" tras seleccionar estado
        buscar_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[normalize-space()='Buscar']")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", buscar_btn)
        buscar_btn.click()

        time.sleep(1)  # pequeño delay para permitir que Radix cierre el select

        # ------------------------------------------------------
        # 4. ABRIR MENÚ DE TRES PUNTOS DEL PRODUCTO (Radix Dropdown)
        # ------------------------------------------------------
        # Limitar selección SOLO a botones dentro de la tabla
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        table_menu_buttons = driver.find_elements(
            By.CSS_SELECTOR,
            "table button[data-slot='dropdown-menu-trigger']"
        )

        assert len(table_menu_buttons) > 0, "❌ No se encontraron botones de menú dentro de la tabla"

        # Usar el primer botón visible dentro de la tabla
        menu_button = None
        for b in table_menu_buttons:
            if b.is_displayed():
                menu_button = b
                break

        assert menu_button is not None, "❌ No hay botón de menú visible en la tabla"

        from selenium.webdriver import ActionChains
        ActionChains(driver).move_to_element(menu_button).click().perform()

        # Esperar contenido del menú y hacer clic en "Editar" (anchor dentro del menú)
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='menu']")))
        editar_link = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//a[@role='menuitem'][contains(., 'Editar')]")
        ))
        editar_link.click()

        # ------------------------------------------------------
        # 5. Página de edición
        # ------------------------------------------------------
        wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//h1[contains(text(),'Editar Producto')]")
        ))

        # Inputs
        name_input = wait.until(EC.visibility_of_element_located((By.ID, "name")))
        description_input = wait.until(EC.visibility_of_element_located((By.ID, "description")))
        price_input = wait.until(EC.visibility_of_element_located((By.ID, "price")))

        # Limpiar campos
        for input_field in [name_input, description_input, price_input]:
            input_field.send_keys(Keys.CONTROL, "a")
            input_field.send_keys(Keys.DELETE)

        # Escribir nuevos valores
        name_input.send_keys("Cama Selenium Editada")
        description_input.send_keys("Cama nueva actualizada desde Selenium")
        price_input.send_keys("50")

        # 6. Guardar cambios
        save_btn = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", save_btn)
        save_btn.click()

        # Validar redirección a mis productos
        wait.until(EC.url_contains("/my-products"))

        # Validar por toast de éxito o filtrar por nombre en la tabla
        # Primero intentar detectar el toast de éxito
        try:
            wait.until(EC.visibility_of_element_located(
                (By.XPATH, "//div[normalize-space()='Producto actualizado exitosamente']")
            ))
        except:
            pass

        # Filtrar por nombre y buscar en la tabla para evitar paginación/orden
        nombre_input = wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//input[@placeholder='Nombre del producto...']")
        ))
        nombre_input.clear()
        nombre_input.send_keys("Cama Selenium Editada")

        buscar_btn2 = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[normalize-space()='Buscar']")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", buscar_btn2)
        buscar_btn2.click()

        # Esperar que la tabla muestre el producto editado
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        assert wait.until(EC.visibility_of_element_located(
            (By.XPATH, "//table//p[normalize-space()='Cama Selenium Editada']")
        )), "❌ No se encontró el producto editado en la tabla"

        print("🎉 PRODUCTO EDITADO EXITOSAMENTE")
