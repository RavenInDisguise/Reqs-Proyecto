import React, { useEffect, useState } from "react";
import axios from 'axios';
import './ListaEstudiantes.css';
import '../Tarjeta.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'

let listaCompleta = [];
const reactivarEstudiante = 'Puede volver a activar al estudiante desde el menú de edición';

export default () => {
    useEffect(() => {
        axios.get('/estudiantes').then((response) => {
            try {
                listaCompleta = response.data;
            } catch (error) {
                alert('Ocurrió un error al cargar la información');
            }
            generarPagina(1, porPagina, true, '');
        })
    },
    []);

    const opcionesPorPagina = [10, 20, 30, 50];
    const [lista, setLista] = useState(null);
    const [porPagina, setPorPagina] = useState(opcionesPorPagina[0]);
    const [paginas, setPaginas] = useState(1);
    const [pagina, setPagina] = useState(1);
    const [filtro, setFiltro] = useState(null);
    const [totalElementos, setTotalElementos] = useState(null);

    let listaFiltrada = [];

    const funcionFiltro = (elemento, nuevoFiltro) => {
        return (elemento.Nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.Nombre.toLowerCase().indexOf(nuevoFiltro.toLowerCase()) != -1
                || elemento.carnet.toString().indexOf(nuevoFiltro) != -1
                || elemento.cedula.toString().indexOf(nuevoFiltro) != -1)
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

    const desactivarUsuario = (idEstudiante) => {
        for (let i = 0; i < listaCompleta.length; i++) {
            if (listaCompleta[i].id == idEstudiante) {
                listaCompleta[i].activo = false;
                break;
            }
        }
    }

    return (
        <div className="tarjeta Lista-Estudiantes">
            <h1>Gestión de estudiantes</h1>
            { (lista) ? (
                <div className="filtros">
                    <div className="filtro">
                        <label for="filtroInput">Buscar:</label>
                        <input className="form-control" onChange={e => generarPagina(pagina, porPagina, false, e.target.value)} type="text" id="filtroInput" placeholder="Nombre, carné o cédula" value={filtro}></input>
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
                        <div className="estudiante">
                            <div className="datos">
                                <div className="nombre">
                                    {e.Nombre}
                                </div>
                                <div className="otros-datos">
                                    <p><b>Carné:</b> {e.carnet} <b>· Cédula:</b> {e.cedula} <b>· Correo:</b> <a href={"mailto:" + e.correo}>{e.correo}</a></p>
                                </div>
                            </div>
                            <div className="opciones">
                                <FontAwesomeIcon className="iconoOpcion desactivado" icon={faEye} title="Ver historial" />
                                <FontAwesomeIcon className="iconoOpcion desactivado" icon={faPenToSquare} title="Modificar estudiante" />
                                {(e.activo) ? (
                                    <FontAwesomeIcon className="iconoOpcion" icon={faTrashCan} title="Desactivar estudiante" onClick={() => {
                                        if (window.confirm('¿Desea desactivar al estudiante ' + e.Nombre + '?')) {
                                            axios.put('/estudiante/eliminar?id=' + e.id).then((response) => {
                                            try {
                                                if (response.status == 200) {
                                                    desactivarUsuario(e.id);
                                                    generarPagina(pagina, porPagina, true, filtro);
                                                    alert('Estudiante desactivado exitosamente');
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
                                    <FontAwesomeIcon className="iconoOpcion desactivado" icon={faTrashCan} title={reactivarEstudiante} />
                                )}
                            </div>
                        </div>))}
                </div>
            ) : (<p>Cargando...</p>)}
            {(totalElementos != null) ? (<p class="total"><b>Total de resultados:</b> {totalElementos}</p>) : (<p></p>)}
        </div>
    )
};