import Link from "next/link";
import { Clock, Cpu, CreditCard, ShieldCheck } from "lucide-react";
import { TemaPie } from "./TemaPie";

export function Pie() {
  return (
    <footer className="ap-pie">
      <div className="ap-contenedor ap-pie__grid">
        <div className="ap-pie__marca">
          <span className="ap-marca">
            <Cpu size={22} strokeWidth={2} aria-hidden />
            <span>ECOMERS</span>
          </span>
          <p>Tecnología para trabajar, estudiar y jugar. Precios en pesos colombianos.</p>
        </div>
        <nav aria-label="Comprar">
          <h2>Comprar</h2>
          <Link href="/productos">Catálogo</Link>
          <Link href="/categorias">Categorías</Link>
          <Link href="/carrito">Carrito</Link>
        </nav>
        <nav aria-label="Tu cuenta">
          <h2>Tu cuenta</h2>
          <Link href="/ingresar">Ingresar</Link>
          <Link href="/registro">Crear cuenta</Link>
          <Link href="/cuenta">Mi cuenta</Link>
        </nav>
        <div>
          <h2>Compra tranquilo</h2>
          <p>
            <ShieldCheck size={16} strokeWidth={2} aria-hidden /> Pago seguro con Wompi
          </p>
          <p>
            <CreditCard size={16} strokeWidth={2} aria-hidden /> Tarjeta, PSE y Nequi
          </p>
          <p>
            <Clock size={16} strokeWidth={2} aria-hidden /> Stock apartado mientras pagas
          </p>
        </div>
      </div>
      <div className="ap-contenedor ap-pie__legal">
        <span>© ECOMERS. Todos los derechos reservados.</span>
        <TemaPie />
      </div>
    </footer>
  );
}
