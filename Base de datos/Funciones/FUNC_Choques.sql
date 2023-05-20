--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Función que determina si hay un choque entre una reserva
--              nueva y otra reserva en el mismo cubículo o del mismo
--              estudiante
--              Recibe un @IN_idEstudiante o un @IN_idCubiculo
--              Retorna 1 si hay un choque, 0 si no lo hay
--------------------------------------------------------------------------

CREATE OR ALTER FUNCTION [dbo].[BiblioTEC_FUNC_Choques]
(
    @IN_horaInicio          DATETIME,
    @IN_horaFin             DATETIME,
    @IN_idEstudiante        INT = NULL,
    @IN_idCubiculo          INT = NULL,
    @IN_idReservaExcluir    INT = NULL
)
RETURNS BIT
AS
BEGIN

    -- Choques dentro del cubículo
    IF EXISTS (
        SELECT  1
        FROM    [dbo].[Reservas] R
        WHERE   R.[idCubiculo] = @IN_idCubiculo
            AND R.[activo] = 1
            AND R.[id] != (
                CASE
                    WHEN @IN_idReservaExcluir IS NULL THEN -1
                    ELSE @IN_idReservaExcluir
                END
            )
        AND
        (
            (
                @IN_horaInicio >= R.[horaInicio]
            AND @IN_horaInicio < R.[horaFin]
            )
            OR
            (
                @IN_horaFin > R.[horaInicio]
            AND @IN_horaFin <= R.[horaFin]
            )
            OR
            (
                R.[horaInicio] > @IN_horaInicio
            AND R.[horaInicio] < @IN_horaFin
            )
            OR
            (
                R.[horaFin] > @IN_horaInicio
            AND R.[horaFin] < @IN_horaFin
            )
        )
    )
    BEGIN
        RETURN 1;
    END;

    -- Choques con el mismo estudiante
    IF EXISTS (
        SELECT  1
        FROM    [dbo].[Reservas] R
        WHERE   R.[idEstudiante] = @IN_idEstudiante
            AND R.[activo] = 1
            AND R.[id] != (
                CASE
                    WHEN @IN_idReservaExcluir IS NULL THEN -1
                    ELSE @IN_idReservaExcluir
                END
            )
        AND
        (
            (
                @IN_horaInicio >= R.[horaInicio]
            AND @IN_horaInicio < R.[horaFin]
            )
            OR
            (
                @IN_horaFin > R.[horaInicio]
            AND @IN_horaFin <= R.[horaFin]
            )
            OR
            (
                R.[horaInicio] > @IN_horaInicio
            AND R.[horaInicio] < @IN_horaFin
            )
            OR
            (
                R.[horaFin] > @IN_horaInicio
            AND R.[horaFin] < @IN_horaFin
            )
        )
    )
    BEGIN
        RETURN 1;
    END;

    RETURN 0;
END;