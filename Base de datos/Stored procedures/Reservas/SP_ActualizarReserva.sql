--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-19
-- Descripción: Procedimiento para actualizar una reserva
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ActualizarReserva]
    @IN_idReserva           INT,
    @IN_idCubiculo          INT,
    @IN_idEstudiante        INT,
    @IN_horaInicio          DATETIME,
    @IN_horaFin             DATETIME,
    @IN_activo                 BIT,
    @IN_confirmado             BIT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    -- 

    BEGIN TRY

        -- VALIDACIONES
        -- ¿Existe la reserva?
        IF NOT EXISTS(
            SELECT  1
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva
                AND R.[eliminada] = 0
        )
        BEGIN
            RAISERROR('No existe ninguna reserva con el ID %d', 16, 1, @IN_idReserva);
        END;

        -- Comprobación de la fecha
        IF @IN_horaFin <= @IN_horaInicio
        BEGIN
            RAISERROR('La hora final no puede ser menor o igual que la inicial', 16, 1);
        END;

        IF (@IN_horaInicio < GETUTCDATE() OR @IN_horaFin < GETUTCDATE())
        BEGIN
            RAISERROR('Ni la hora de inicio ni la hora de finalización pueden ser anteriores a la hora actual', 16, 1);
        END;

        -- Comprobación del cubículo
        IF (SELECT  R.[idCubiculo]
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva) != @IN_idCubiculo
        BEGIN
            -- Cambió el ID del cubículo
            IF NOT EXISTS(  SELECT  1
                        FROM    [dbo].[Cubiculos] C
                        WHERE   C.[id] = @IN_idCubiculo    )
            BEGIN
                -- No existe el cubículo
                RAISERROR('No existe el cubículo proporcionado', 16, 1);
            END;
        END;

        -- Comprobación del estudiante
        IF (SELECT  R.[idEstudiante]
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva) != @IN_idEstudiante
        BEGIN
            -- Cambió el ID del estudiante
            IF NOT EXISTS(  SELECT  1
                        FROM    [dbo].[Estudiantes] E
                        WHERE   E.[id] = @IN_idEstudiante
                            AND E.[activo] = 1)
            BEGIN
                -- No existe el estudiante
                RAISERROR('El estudiante proporcionado no coincide con un estudiante activo en el sistema', 16, 1);
            END;
        END;

        -- Verifica que no haya choques
        IF [dbo].[BiblioTEC_FUNC_Choques](@IN_horaInicio, @IN_horaFin, NULL, @IN_idCubiculo, @IN_idReserva) = 1
        BEGIN
            RAISERROR('Hay un choque con otra reserva en el cubículo seleccionado', 16, 1);
        END;

        IF [dbo].[BiblioTEC_FUNC_Choques](@IN_horaInicio, @IN_horaFin, @IN_idEstudiante, NULL, @IN_idReserva) = 1
        BEGIN
            RAISERROR('Hay un choque con otra reserva del estudiante', 16, 1);
        END;

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            UPDATE  R
            SET     R.[idCubiculo] = @IN_idCubiculo,
                    R.[idEstudiante] = @IN_idEstudiante,
                    R.[horaInicio] = @IN_horaInicio,
                    R.[horaFin] = @IN_horaFin,
                    R.[activo] = @IN_activo,
                    R.[confirmado] = @IN_confirmado
            FROM    [dbo].[Reservas] R
            WHERE   R.[id] = @IN_idReserva;

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;