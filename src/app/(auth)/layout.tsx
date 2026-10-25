import Link from "next/link";
import { CreditCard, Cpu, ShieldCheck, Zap } from "lucide-react";
import { BotonTema } from "@/components/BotonTema";

/** Pantallas de acceso: panel de marca a la izquierda y formulario a la derecha. */
export default function LayoutAcceso({ children }: LayoutProps<"/">) {
  return (
    <div className="ap-acceso">
      <aside className="ap-acceso__marca" aria-hidden>
        <Link href="/" className="ap-marca ap-marca--clara">
          <Cpu size={26} strokeWidth={2} />
          <span>ECOMERS</span>
        </Link>
        <div className="ap-acceso__circuito">
          <span />
          <span />
          <span />
          <span />
        </div>
        <ul>
          <li>
            <Zap size={18} strokeWidth={2} /> Lo último en tecnología
          </li>
          <li>
            <ShieldCheck size={18} strokeWidth={2} /> Pagos protegidos con Wompi
          </li>
          <li>
            <CreditCard size={18} strokeWidth={2} /> Tarjeta, PSE o Nequi
          </li>
        </ul>
      </aside>
      <main className="ap-acceso__form">
        <div className="ap-acceso__barra">
          <Link href="/" className="ap-marca ap-acceso__marca-movil">
            <Cpu size={22} strokeWidth={2} aria-hidden />
            <span>ECOMERS</span>
          </Link>
          <BotonTema />
        </div>
        <div className="ap-acceso__caja">{children}</div>
      </main>
    </div>
  );
}
