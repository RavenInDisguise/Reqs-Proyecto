import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './VerReservas.css';
import '../Tarjeta.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const idiomaLocal = ['es-CR', 'es'];
const formatoFecha = { month: 'long', day: 'numeric'};
const formatoHora = {hour12: true, hour: 'numeric', minute: 'numeric'};

let listaCompleta = [];
const reactivarReserva = 'Puede volver a activar la reserva desde el menú de edición';

const ayudaFiltro = `También puede usar los siguientes filtros:

· cubiculo:12, para ver solo las reservas del cubículo cuyo ID es 12
· estudiante:24, para ver solo las reservas del estudiante cuyo ID es 24`;

export default () => {
    const parametros = new URLSearchParams('?' + document.URL.split('/').at(-1).split('?').at(-1));
    const idCubiculo = parametros.get('idCubiculo');
    const idEstudiante = parametros.get('idEstudiante');
    const filtroInicial = [
        (idCubiculo != null ? `cubiculo:${idCubiculo}` : null),
        (idEstudiante != null ? `estudiante:${idEstudiante}` : null)
    ].filter((e) => (e != null)).join(' ');

    useEffect(() => {
        axios.get('/reservas').then((response) => {
            try {
                listaCompleta = response.data;
            } catch (error) {
                alert('Ocurrió un error al cargar la información');
            }
            generarPagina(1, porPagina, true, filtroInicial);
        })
    },
    []);

    const formatoLocal = (stringIso, fecha=true, hora=true) => {
        let respuesta = [];
        try {
            const objetoDate = new Date(stringIso);
            if (fecha) {
                respuesta.push(objetoDate.toLocaleDateString(idiomaLocal, formatoFecha));
            }
            if (hora) {
                respuesta.push(objetoDate.toLocaleTimeString(idiomaLocal, formatoHora));
            }
            return respuesta.join(', ');
        } catch (error) {
            return '';
        }
    }

    const opcionesPorPagina = [10, 20, 30, 50];
    const [lista, setLista] = useState(null);
    const [porPagina, setPorPagina] = useState(opcionesPorPagina[0]);
    const [paginas, setPaginas] = useState(1);
    const [pagina, setPagina] = useState(1);
    const [filtro, setFiltro] = useState(null);
    const [totalElementos, setTotalElementos] = useState(null);
    const [reservasInactivas, setReservasInactivas] = useState(0);
    const [reservasActivas, setReservasActivas] = useState(0);
    const [reservasConfirmadas, setReservasConfirmadas] = useState(0);

    let listaFiltrada = [];

    const funcionFiltro = (elemento, nuevoFiltro) => {
        const filtroCubiculo = nuevoFiltro.match(/cubiculo:(\d+)/);
        const filtroEstudiante = nuevoFiltro.match(/estudiante:(\d+)/);
        nuevoFiltro = nuevoFiltro.replaceAll(/(cubiculo:\d+|estudiante:\d+)/g, "").trim();
        let respuesta = false;
        if (filtroCubiculo != null || filtroEstudiante != null) {
            respuesta = ((filtroCubiculo != null ? (elemento.idCubiculo.toString() == filtroCubiculo[1]) : true)
                && (filtroEstudiante != null ? (elemento.idEstudiante.toString() == filtroEstudiante[1]) : true))
        }
        if (respuesta && nuevoFiltro != '') {
            respuesta = (elemento.nombreEstudiante.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.nombreCubiculo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.nombreEstudiante.toLowerCase().indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.nombreCubiculo.toLowerCase().indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.idCubiculo.toString().indexOf(nuevoFiltro) != -1
                || elemento.id.toString().indexOf(nuevoFiltro) != -1)
        }
        return respuesta;
    };

    const generarPagina = (nuevaPagina = pagina, tamano = porPagina, forzar = false, nuevoFiltro = filtro) => {

        if (pagina != nuevaPagina || tamano != porPagina || forzar || nuevoFiltro != filtro) {
            if (nuevoFiltro != filtro) {
                setFiltro(nuevoFiltro);
                nuevaPagina = 1;
            }
            if (!nuevoFiltro) {
                listaFiltrada = listaCompleta.slice(0, listaCompleta.length);
            } else {
                listaFiltrada = listaCompleta.filter((e) => {return funcionFiltro(e, nuevoFiltro)})
            }
            setReservasInactivas(listaFiltrada.filter((f) => (!f.activo)).length);
            setReservasActivas(listaFiltrada.filter((f) => (f.activo && !f.confirmado)).length);
            setReservasConfirmadas(listaFiltrada.filter((f) => (f.confirmado)).length);

            let nuevoNumeroPaginas = (Math.ceil(listaFiltrada.length / tamano) < 1) ? 1 : Math.ceil(listaFiltrada.length / tamano);
            setPaginas(nuevoNumeroPaginas);

            if (nuevaPagina < 1) {
                nuevaPagina = 1;
            } else if (nuevaPagina > nuevoNumeroPaginas) {
                nuevaPagina = nuevoNumeroPaginas;
            }

            setTotalElementos(listaFiltrada.length);
            setPagina(nuevaPagina);
            let inicio = tamano * (nuevaPagina - 1);
            let fin = tamano * nuevaPagina;
            setLista(listaFiltrada.slice(
                inicio,
                (fin <= listaFiltrada.length) ? fin : listaFiltrada.length
                /* Lo anterior es para devolver el índice del último elemento en caso de que no haya más */
            ));
            let elementoLista = document.getElementById("lista");
            if (elementoLista) {
                elementoLista.scrollTop = 0;
            }
        } else {
            setPagina(nuevaPagina);
        }
    };

    const cambiarTamano = (tamanoNuevo) => {
        setPorPagina(tamanoNuevo);
        setPaginas(Math.ceil(listaFiltrada.length / tamanoNuevo));
        let indice = porPagina * (pagina - 1) // índice del primer elemento de la página actual
        console.log(indice);
        generarPagina(Math.floor(indice / tamanoNuevo) + 1, tamanoNuevo, false, filtro);
    }

    const desactivarReserva = (idReserva) => {
        for (let i = 0; i < listaCompleta.length; i++) {
            if (listaCompleta[i].id == idReserva) {
                listaCompleta[i].activo = false;
                listaCompleta[i].confirmado = false;
                break;
            }
        }
    }

    return (
        <div className="tarjeta Lista-Reservas">
            <h1>Gestión de reservas</h1>
            { (lista) ? (
                <div className="filtros">
                    <div className="filtro">
                        <label for="filtroInput">Buscar:</label>
                        <input className="form-control" onChange={e => generarPagina(pagina, porPagina, false, e.target.value)} type="text" id="filtroInput" placeholder="Estudiante, cubículo o número de reserva" title={ayudaFiltro} value={filtro}></input>
                    </div>
                    <div className="filtro">
                        <label for="porPaginaSelect">Resultados por página: </label>
                        <select id="porPaginaSelect" onChange={e => {cambiarTamano(e.target.value);setPorPagina(e.target.value);}}>
                            {(opcionesPorPagina.map((o) => (<option value={o}>{o}</option>)))}
                        </select>
                    </div>
                    <div className="filtro">
                        <label for="paginaInput">Página</label>
                        <a href="javascript:void(0);" onClick={e => {generarPagina(pagina -1)}}>←</a>
                        <input className="form-control" onChange={e => {generarPagina((e.target.value >= 1 && e.target.value <= paginas) ? e.target.value : pagina)}} type="number" id="paginaInput" min={1} max={paginas} value={pagina}></input>
                        <a href="javascript:void(0);" onClick={e => {generarPagina(pagina + 1)}}>→</a>
                        <p>/ {paginas}</p>
                    </div>
                </div>
            ) : (<p></p>)}
            { (lista) ? (
                <div className="lista" id="lista">
                    {lista.map((e) => (
                        <div className="reserva-lista">
                            <div className="datos">
                                <p>
                                    <span className={"estadoReserva " + (e.confirmado ? "confirmado" : (e.activo ? "activo" : "inactivo"))}></span>
                                    <span className="nombre">Reserva n.º {e.id}</span>
                                    <b> · Fecha:</b> {formatoLocal(e.fecha)}
                                    <b> · Cubículo:</b> {e.nombreCubiculo} (ID: {e.idCubiculo})
                                </p>
                                <div className="otros-datos">
                                    <p><b>Estudiante:</b> {e.nombreEstudiante} (ID: {e.idEstudiante}) <b>· Fecha reservada:</b> {formatoLocal(e.horaInicio, true, false)}, de {formatoLocal(e.horaInicio, false, true)} a {formatoLocal(e.horaFin, false, true)}</p>
                                </div>
                            </div>
                            <div className="opciones">
                                <FontAwesomeIcon className="iconoOpcion desactivado" icon={faPenToSquare} title="Modificar reserva" />
                                {(e.activo) ? (
                                    <FontAwesomeIcon className="iconoOpcion" icon={faTrashCan} title="Borrar reserva" onClick={() => {
                                        if (window.confirm('¿Desea borrar la reserva actual?')) {
                                            axios.put('/reserva/eliminar?id=' + e.id).then((response) => {
                                            try {
                                                if (response.status == 200) {
                                                    desactivarReserva(e.id);
                                                    generarPagina(pagina, porPagina, true, filtro);
                                                    alert('Reserva desactivada exitosamente');
                                                } else {
                                                    alert('Ocurrió un ejecutar la operación');
                                                }
                                            } catch (error) {
                                                alert('Ocurrió un ejecutar la operación');
                                            }
                                        }).catch((error) => {
                                            alert('Ocurrió un ejecutar la operación');
                                        })
                                        }
                                    }} />
                                ) : (
                                    <FontAwesomeIcon className="iconoOpcion desactivado" icon={faTrashCan} title={reactivarReserva} />
                                )}
                            </div>
                        </div>))}
                </div>
            ) : (<p>Cargando...</p>)}
            {(totalElementos != null) ? (<p class="total">
                <b>Total de reservas:</b> {totalElementos} {(totalElementos > 0) ? (
                    <span>({[
                        { clase: "confirmado", valor: (reservasConfirmadas > 0 ? ((reservasConfirmadas > 1 ? (reservasConfirmadas + " confirmadas") : "1 confirmada" )) : "")},
                        { clase: "activo", valor: (reservasActivas > 0 ? (reservasActivas > 1 ? (reservasActivas + " activas") : "1 activa" ) : "")},
                        { clase: "inactivo", valor: (reservasInactivas > 0 ? (reservasInactivas > 1 ? (reservasInactivas + " inactivas") : "1 inactiva" ) : "")}
                    ].filter((f) => f.valor != '').map((r, i, a) => (<span><span className={"estadoReserva " + r.clase}></span> {r.valor + (i < a.length - 1 ? ", " : "")}</span>))})</span>) : <></>}
                </p>) : (<p></p>)}
        </div>
    )
};